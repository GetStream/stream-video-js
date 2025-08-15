import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { InputMediaDeviceManagerState } from '../InputMediaDeviceManagerState';
import { RxUtils } from '../../store';

/**
 * Base state class for High Fidelity enabled device managers.
 */
export abstract class HiFiDeviceManagerState<
  C,
> extends InputMediaDeviceManagerState<C> {
  private hiFiEnabledSubject = new BehaviorSubject<boolean>(false);

  /**
   * An Observable that emits the current HiFi status.
   */
  hiFiEnabled$ = this.hiFiEnabledSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  /**
   * Returns `true` when High Fidelity mode is enabled.
   */
  get hiFiEnabled() {
    return RxUtils.getCurrentValue(this.hiFiEnabled$);
  }

  /**
   * Enables or disables High Fidelity mode.
   */
  setHiFiEnabled(enabled: boolean) {
    RxUtils.setCurrentValue(this.hiFiEnabledSubject, enabled);
  }
}
