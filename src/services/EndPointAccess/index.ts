import axios, { AxiosResponse } from 'axios';

export default class EndPointAccess {
  theUrl: string;

  constructor(url: string) {
    this.theUrl = url;
  }

  async getRes<T = unknown>(): Promise<AxiosResponse<T>> {
    const response = await axios.get<T>(this.theUrl, {
      headers: { Accept: 'application/json' },
    });
    return response;
  }
}
