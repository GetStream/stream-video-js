import addBroadcastExtensionXcodeTarget, {
  MIN_DEPLOYMENT_TARGET,
  resolveDeploymentTarget,
} from '../src/withIosScreenCapture/addBroadcastExtensionXcodeTarget';

const DEVELOPMENT_TEAM_ID = 'ABCDE12345';

/**
 * Minimal stand-in for the parts of the `xcode` project object that
 * addBroadcastExtensionXcodeTarget touches. Captures the build configurations
 * it generates so they can be asserted on.
 */
const createProjectStub = (
  deploymentTargets: (string | number | undefined)[],
) => {
  const buildConfigurationSection: Record<string, any> = {};
  deploymentTargets.forEach((target, index) => {
    buildConfigurationSection[`UUID${index}`] = {
      isa: 'XCBuildConfiguration',
      buildSettings:
        target === undefined ? {} : { IPHONEOS_DEPLOYMENT_TARGET: target },
    };
    buildConfigurationSection[`UUID${index}_comment`] = 'Debug';
  });

  let uuidCounter = 0;

  // the module mutates this in place, so every call must see the same object
  const projectSection: Record<string, any> = {
    PROJECT_UUID: { attributes: {} },
  };

  return {
    addedConfigurations: [] as any[],
    pbxXCBuildConfigurationSection: () => buildConfigurationSection,
    generateUuid: () => `GENERATED${uuidCounter++}`,
    getFirstProject: () => ({
      uuid: 'PROJECT_UUID',
      firstProject: { targets: [] },
    }),
    getFirstTarget: () => ({ firstTarget: { name: 'TestApp' } }),
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
