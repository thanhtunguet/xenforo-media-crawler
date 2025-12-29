import { ILoginAdapter } from './login-adapter.interface';
import { BaseLoginAdapter } from './base-login-adapter';
import { XamvnCloneLoginAdapter } from './xamvn-clone-login.adapter';
import { XamVNComLoginAdapter } from './xamvn-com-login.adapter';

export { ILoginAdapter } from './login-adapter.interface';
export { BaseLoginAdapter } from './base-login-adapter';
export { XamvnCloneLoginAdapter } from './xamvn-clone-login.adapter';
export { XamVNComLoginAdapter } from './xamvn-com-login.adapter';

/**
 * Enum for available login adapter types
 */
export enum LoginAdapterType {
  XAMVN_CLONE = 'xamvn-clone',
  XAMVN_COM = 'xamvn-com',
}

/**
 * Get a login adapter instance by type
 */
export function getLoginAdapter(type: LoginAdapterType): ILoginAdapter {
  switch (type) {
    case LoginAdapterType.XAMVN_CLONE:
      return new XamvnCloneLoginAdapter();
    case LoginAdapterType.XAMVN_COM:
      return new XamVNComLoginAdapter();
    default:
      throw new Error(`Unknown login adapter type: ${type}`);
  }
}
