import { debug } from 'ag-common/dist/common/helpers/log';
import CognitoProvider from 'next-auth/providers/cognito';

//test cognito provider can be imported correctly
function test() {
  try {
    //@ts-ignore

    new CognitoProvider(undefined as any);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    debug('next-auth export test OK');
    //
  }
}

test();
