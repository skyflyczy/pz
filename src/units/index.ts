export const formatTime = (time: Date | string | number | undefined, format: string = 'MM/dd HH:mm'): string => {
  const date = time ? (typeof time === 'object' ? time : new Date(time)) : new Date();

  const timeMap: Record<string, number> = {
    'Y+': date.getFullYear(),
    'M+': date.getMonth() + 1,
    'm+': date.getMinutes(),
    'd+': date.getDate(),
    'H+': date.getHours(),
    's+': date.getSeconds()
  };

  if (/(Y+)/.test(format)) {
    format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  }

  for (const key in timeMap) {
    if (new RegExp(`(${key})`).test(format)) {
      const match = RegExp.$1;
      let value = timeMap[key];
      // 关键：只有匹配长度 >=2 才补零，单个字符不补零
      if (match.length >= 2) {
        const paddedValue = value < 10 ? `0${value}` : value;
        format = format.replace(match, paddedValue.toString());
      } else {
        format = format.replace(match, value.toString());
      }
    }
  }

  return format;
};

export const formatTxid = (txid: string | undefined, bits: number = 4): string | undefined => {
    if (!txid) {
        return txid;
    }

    return `${txid.slice(0, bits)}...${txid.slice(-bits)}`;
}

export const jumpToTxidDetail = (txid: string | undefined): void => {
    if (!txid) {
        return;
    }

    window.open(`https://viewblock.io/arweave/tx/${txid}`, '_blank');
}

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));