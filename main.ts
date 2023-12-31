import 'https://deno.land/std@0.193.0/dotenv/load.ts';

import createProperties from './src/createProperties.ts';
import getItemList from './src/getItemList.ts';
import getOgp from './src/getOgp.ts';
import postBluesky from './src/postBluesky.ts';
import postWebhook from './src/postWebhook.ts';
import resizeImage from './src/resizeImage.ts';

// rss feedから記事リストを取得
const itemList = await getItemList();
console.log(JSON.stringify(itemList, null, 2));

// 取得した記事リストをループ処理
for await (const item of itemList) {
  // URLからOGPの取得
  const og = await getOgp(item.href);

  // 投稿記事のプロパティを作成
  const { bskyText, xText, title, link, description } = await createProperties(
    og
  );

  // 画像のリサイズ
  const { mimeType, resizedImage } = await (async () => {
    const ogImage = og.ogImage?.at(0);
    if (!ogImage) {
      console.log('ogp image not found');
      return {};
    }
    return await resizeImage(new URL(ogImage.url, link).href);
  })();

  // Blueskyに投稿
  await postBluesky({
    rt: bskyText,
    title,
    link,
    description,
    mimeType,
    image: resizedImage,
  });

  // IFTTTを使ってXに投稿
  await postWebhook(xText);
}
