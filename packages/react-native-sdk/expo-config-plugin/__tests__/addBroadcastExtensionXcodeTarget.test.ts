import addBroadcastExtensionXcodeTarget, {
  MIN_DEPLOYMENT_TARGET,
  resolveDeploymentTarget,
} from '../src/withIosScreenCapture/addBroadcastExtensionXcodeTarget';

const DEVELOPMENT_TEAM_ID = 'ABCDE12345';

type StubOptions = {
  /** Deployment targets on the host app target's own configurations. */
  appTargets?: (string | number | undefined)[];
  /** Deployment targets on the project-level configurations. */
  projectTargets?: (string | number | undefined)[];
  /**
   * Deployment targets belonging to targets other than the host app (widgets,
   * other extensions). These must never influence the resolved value.
   */
  otherTargets?: (string | number | undefined)[];
};

/**
 * Minimal stand-in for the parts of the `xcode` project object that
 * addBroadcastExtensionXcodeTarget touches. Captures the build configurations
 * it generates so they can be asserted on.
 *
 * Models real project structure: configurations live in the flat
 * XCBuildConfiguration section, and each target reaches its own subset through
 * an XCConfigurationList.
 */
const createProjectStub = (
  options: StubOptions | (string | number | undefined)[],
) => {
  const {
    appTargets = [],
    projectTargets = [],
    otherTargets = [],
  } = Array.isArray(options) ? { appTargets: options } : options;

  const buildConfigurationSection: Record<string, any> = {};
  const configurationLists: Record<string, any> = {};

  const addList = (
    listUuid: string,
    targets: (string | number | undefined)[],
    prefix: string,
  ) => {
    const buildConfigurations = targets.map((target, index) => {
      const uuid = `${prefix}${index}`;
      buildConfigurationSection[uuid] = {
        isa: 'XCBuildConfiguration',
        buildSettings:
          target === undefined ? {} : { IPHONEOS_DEPLOYMENT_TARGET: target },
      };
      buildConfigurationSection[`${uuid}_comment`] = 'Debug';
      return { value: uuid, comment: 'Debug' };
    });
    configurationLists[listUuid] = { buildConfigurations };
  };

  addList('APP_LIST', appTargets, 'APP');
  addList('PROJECT_LIST', projectTargets, 'PROJ');
  // reachable in the flat section but not from the app or project lists
  addList('OTHER_LIST', otherTargets, 'OTHER');

  let uuidCounter = 0;

  // the module mutates this in place, so every call must see the same object
  const projectSection: Record<string, any> = {
    PROJECT_UUID: { attributes: {} },
  };

  return {
    addedConfigurations: [] as any[],
    pbxXCBuildConfigurationSection: () => buildConfigurationSection,
    pbxXCConfigurationList: () => configurationLists,
    generateUuid: () => `GENERATED${uuidCounter++}`,
    getFirstProject: () => ({
      uuid: 'PROJECT_UUID',
      firstProject: { targets: [], buildConfigurationList: 'PROJECT_LIST' },
    }),
    getFirstTarget: () => ({
      firstTarget: { name: 'TestApp', buildConfigurationList: 'APP_LIST' },
    }),
    addXCConfigurationList(configurations: any[]) {
      this.addedConfigurations = configurations;
      return { uuid: 'CONFIG_LIST_UUID' };
    },
    updateBuildProperty: () => undefined,
    addFramework: () => ({ path: 'ReplayKit.framework' }),
    addToPbxFileReferenceSection: () => undefined,
    addToPbxBuildFileSection: () => undefined,
    addToPbxNativeTargetSection: () => undefined,
    addToPbxProjectSection: () => undefined,
    addTargetDependency: () => undefined,
    addBuildPhase: () => ({ buildPhase: {} }),
    addToPbxGroup: () => undefined,
    addPbxGroup: () => ({ uuid: 'GROUP_UUID' }),
    pbxProjectSection: () => projectSection,
    hash: { project: { objects: { PBXGroup: {} } as Record<string, any> } },
  };
};

describe('resolveDeploymentTarget', () => {
  it('falls back to the minimum when the project declares no target', () => {
    const proj = createProjectStub([]);
    expect(resolveDeploymentTarget(proj as any)).toBe(MIN_DEPLOYMENT_TARGET);
  });

  it('never lowers the target below the extension minimum', () => {
    const proj = createProjectStub(['12.0', '13.4']);
    expect(resolveDeploymentTarget(proj as any)).toBe(MIN_DEPLOYMENT_TARGET);
  });

  it("raises the target to match the host app's deployment target", () => {
    const proj = createProjectStub(['16.4', '16.4']);
    expect(resolveDeploymentTarget(proj as any)).toBe('16.4');
  });

  it('picks the highest target when configurations disagree', () => {
    const proj = createProjectStub(['15.1', '16.4', '14.0']);
    expect(resolveDeploymentTarget(proj as any)).toBe('16.4');
  });

  it('compares versions numerically rather than lexically', () => {
    const proj = createProjectStub(['9.0', '15.0']);
    expect(resolveDeploymentTarget(proj as any)).toBe('15.0');
  });

  it('ignores quoted values and non-version placeholders', () => {
    const proj = createProjectStub(['"16.4"', '$(inherited)', undefined]);
    expect(resolveDeploymentTarget(proj as any)).toBe('16.4');
  });

  it('rejects versions with a non-numeric suffix', () => {
    // Number.parseInt('4beta') is 4, so a naive parse would adopt "16.4beta"
    // verbatim and write an invalid value into the build setting.
    const proj = createProjectStub(['16.4beta']);
    expect(resolveDeploymentTarget(proj as any)).toBe(MIN_DEPLOYMENT_TARGET);

    const withValid = createProjectStub(['16.4beta', '15.1']);
    expect(resolveDeploymentTarget(withValid as any)).toBe('15.1');
  });

  it('reads the project-level target when the app target inherits it', () => {
    const proj = createProjectStub({
      appTargets: ['$(inherited)'],
      projectTargets: ['16.4'],
    });
    expect(resolveDeploymentTarget(proj as any)).toBe('16.4');
  });

  // The extension must never require a newer iOS than the app it ships inside:
  // a widget or notification-service extension on a higher target would
  // otherwise silently drop screen share on devices in between.
  it('ignores deployment targets belonging to unrelated targets', () => {
    const proj = createProjectStub({
      appTargets: ['15.1', '15.1'],
      projectTargets: ['15.1'],
      otherTargets: ['17.0', '18.0'],
    });
    expect(resolveDeploymentTarget(proj as any)).toBe('15.1');
  });

  it('satisfies the minimum accepted by Xcode 27 for a modern app', () => {
    const proj = createProjectStub(['16.4']);
    const [major] = resolveDeploymentTarget(proj as any)
      .split('.')
      .map(Number);
    expect(major).toBeGreaterThanOrEqual(15);
  });
});

describe('addBroadcastExtensionXcodeTarget', () => {
  const addTarget = (deploymentTargets: string[]) => {
    const proj = createProjectStub(deploymentTargets);
    addBroadcastExtensionXcodeTarget(proj as any, {
      appName: 'TestApp',
      extensionName: 'broadcast',
      extensionBundleIdentifier: 'io.getstream.test.broadcast',
      currentProjectVersion: '1',
      marketingVersion: '1.0.0',
      developmentTeamId: DEVELOPMENT_TEAM_ID,
    });
    return proj.addedConfigurations;
  };

  it('writes DEVELOPMENT_TEAM into every build configuration', () => {
    const configurations = addTarget(['16.4']);

    expect(configurations).toHaveLength(2);
    expect(configurations.map((c) => c.name)).toEqual(['Debug', 'Release']);
    configurations.forEach((configuration) => {
      expect(configuration.buildSettings.DEVELOPMENT_TEAM).toBe(
        DEVELOPMENT_TEAM_ID,
      );
    });
  });

  it('applies the resolved deployment target to every build configuration', () => {
    const configurations = addTarget(['16.4']);

    configurations.forEach((configuration) => {
      expect(configuration.buildSettings.IPHONEOS_DEPLOYMENT_TARGET).toBe(
        '16.4',
      );
    });
  });

  it('keeps the minimum deployment target for older host apps', () => {
    const configurations = addTarget(['13.4']);

    configurations.forEach((configuration) => {
      expect(configuration.buildSettings.IPHONEOS_DEPLOYMENT_TARGET).toBe(
        MIN_DEPLOYMENT_TARGET,
      );
    });
  });
});
