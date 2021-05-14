import { Client } from '@replit/database';

const DEFAULT_BALANCE = 250.25;

export interface User {
  userId: string, // Slack userid
  funditsReceived: number, // Fundits this user has received from others
  funditsBalance: number, // Fundits this user can give to others
  isAdmin: boolean | undefined, // Is user an administrator
}

export class Database {
  #client;

  public constructor() {
    this.#client = new Client();
  }

  public async findAll() {
    return await this.#client.getAll() as Record<string, User>;
  }

  public async findUser(userId: string) {
    const user = await this.#client.get(userId) as (User | undefined);
    return user || {
      userId,
      funditsReceived: 0,
      funditsBalance: DEFAULT_BALANCE,
      isAdmin: false,
    };
  }

  private async replaceUser(user: User) {
    //XXX need audit trail
    await this.#client.set(user.userId, user);
  }

  public async transferFundits(fromUserId: string, toUserId: string, fundits: number) {
    const fromUser = await this.findUser(fromUserId);
    const toUser = await this.findUser(toUserId);
    if (fromUser.userId === toUser.userId) {
      throw new Error('You cannot give fundits to yourself. This attempt has been reported to the IRS.');
    }
    if (fundits < 0) {
      throw new Error('Sending negative fundits is immoral.');
    }
    if (fromUser.funditsBalance - fundits < 0) {
      throw new Error(`Not enough fundits, your balance is ${fromUser.funditsBalance}`);
    }
    fromUser.funditsBalance -= fundits;
    toUser.funditsReceived += fundits;
    this.replaceUser(fromUser);
    this.replaceUser(toUser);
  }
}
