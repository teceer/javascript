import type { AuthReason } from './tokens/authStatus';
import { AuthStatus } from './tokens/authStatus';

type AuthStateFactoryParams = {
  status: AuthStatus;
  message?: string;
  reason?: AuthReason;
};

export class AuthStatusFactory {
  readonly options: Record<string, any>;

  constructor(options: Record<string, any>) {
    this.options = options;
  }

  create({ status, message, reason }: AuthStateFactoryParams) {
    if (status === AuthStatus.SignedIn) {
      return this.signedIn();
    } else if (status === AuthStatus.SignedOut) {
      return this.signedOut();
    } else {
      return this.interstitial();
    }
  }

  private signedIn() {
    return {};
  }

  private signedOut() {
    return {};
  }

  private interstitial() {
    return {};
  }
}
