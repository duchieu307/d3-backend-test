import Web3, { HttpProvider } from 'web3';

export class Web3Helper {
  public static web3Provider(providerUrl?: string): Web3 {
    return new Web3(new HttpProvider(providerUrl));
  }

  static verifyWalletAddressBySignature(
    address: string,
    message: string,
    signature: string,
  ): boolean {
    try {
      const web3 = new Web3();

      const recover = web3.eth.accounts.recover(message, signature);

      const recoverConvert = Web3.utils.toChecksumAddress(recover);
      const addressConvert = Web3.utils.toChecksumAddress(address);

      return addressConvert === recoverConvert;
    } catch (e) {
      return false;
    }
  }

  static isValidAddress(address: string): boolean {
    const web3 = new Web3();
    return web3.utils.isAddress(address);
  }

  static toWei(value: string, decimal = 18): string {
    let unit: any = 'ether';
    switch (decimal) {
      case 18:
        unit = 'ether';
        break;
    }
    return new Web3().utils.toWei(value, unit);
  }

  static fromWei(value: string, decimal = 18): string {
    let unit: any = 'ether';
    switch (decimal) {
      case 18:
        unit = 'ether';
        break;
    }
    return new Web3().utils.fromWei(value, unit);
  }

  static async getCurrentGas(): Promise<bigint> {
    const web3 = new Web3();
    const gasPrice = await web3.eth.getGasPrice();
    return gasPrice;
  }
}
