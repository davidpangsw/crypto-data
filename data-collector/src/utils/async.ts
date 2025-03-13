
export const sleepForever = () => new Promise<never>(() => {});
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));