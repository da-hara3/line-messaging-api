const fs = require("fs");
const puppeteer = require('puppeteer');
const url = 'https://shisetsu.city.arakawa.tokyo.jp/stagia/reserve/gin_menu'; // 任意のURL;
const waitTime = 5000;
const waitTimeForSamePage = 2000;

const userId = process.env.ARAKAWA_USER_ID;
const passWord = process.env.ARAKAWA_PASSWORD;

// よく使う記法まとめ
// https://qiita.com/rh_taro/items/32bb6851303cbc613124

// 要素の選択方法まとめ
// https://qiita.com/go_sagawa/items/85f97deab7ccfdce53ea

/**
 * 荒川区の空いているコートを返すよ。
 * TODO: TypeScript化とシンプル化・・・
 * @export
 * @returns
 * [{
 *  day: ""
 *  result: {
 *    cortName: "",
 *    emptyTimes: []
 *   }
 * }]
 */
module.exports = async function () {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    const response = await page.goto(url);

    await page.waitFor('input[alt="多機能操作"]', { timeout: waitTime });
    page.click('input[alt="多機能操作"]');


    await page.waitFor('#user', { timeout: waitTime });
    await page.type('#user', userId);
    await page.type('#password', passWord);
    await page.click('input[alt="ログイン"]');

    await page.waitFor('#to-top-page', { timeout: waitTime });
    const g_sessionId = await page.$eval('#to-top-page', el => el.children[0].getAttribute("href").replace("/stagia/reserve/gml_login?g_sessionid=", ""));

    await page.goto(`https://shisetsu.city.arakawa.tokyo.jp/stagia/reserve/gml_z_group_sel_1?u_genzai_idx=0&g_kinonaiyo=17&g_sessionid=${g_sessionId}`)

    await page.waitFor('select[name="g_bunruicd_1_show"]', { timeout: waitTime });
    await page.select('select[name="g_bunruicd_1_show"]', '1300');
    await page.evaluate(({ }) => submitBunrui1(), {});
    await page.waitFor(waitTimeForSamePage)

    await page.select('select[name="g_bunruicd_2_show"]', '1350');
    await page.evaluate(({ }) => submitBunrui2(), {});
    await page.waitFor(waitTimeForSamePage)

    await page.select('select[name="riyosmk"]', '200');
    await page.evaluate(({ }) => changed(), {});
    await page.waitFor(waitTimeForSamePage)

    await page.evaluate(({ }) => btnSELALL_3(), {});
    await page.waitFor(waitTimeForSamePage)
    await page.evaluate(({ }) => btnOK_3(), {});
    await page.waitFor(waitTimeForSamePage)

    await page.select('select[name="g_heyacd"]', "2,716,71,7115000", "2,716,71,7116000", "2,716,71,7117000", "2,716,71,7118000", "2,716,71,7119000", "2,720,71,7122000", "2,762,76,7602000", "2,762,76,7603000", "2,762,76,7604000", "2,762,76,7605000", "2,762,76,7606000", "2,762,76,7609000", "2,762,76,7607000", "2,762,76,7608000")

    await page.evaluate(({ }) => heyaOK(), {});
    await page.waitFor(waitTimeForSamePage)

    await page.evaluate(({ }) => {
      clickYobi(0);
      clickYobi(6);
      clickYobi(7);
    }
      , {});
    await page.click('#btnOK');

    // 予約ページへの遷移待ち
    await page.waitFor('table', { timeout: waitTime });
    // await outputScreenshot("", "test.jpg", page);

    // ここから空いているところ探し。
    // 次へがなくなるまで操作
    const result = [];
    let loopCount = 0;
    while (true) {
      console.log(await page.evaluate(() => document.querySelector(".inner-block").querySelector("h3").textContent))
      result.push(await scrapeReservePage(page));
      console.log("スクレイプ完了")
      if (await notExistsNextPage(page) || loopCount > 100) {
        break;
      }
      console.log("次行く")
      await moveNextPage(page);

      loopCount++;
    }

    return result;
    result.forEach((t) => {
      console.log(t.day);
      console.log(t.result);
    })
  } catch (e) {
    console.log(e);
  } finally {
    browser.close();
  }
};


const outputScreenshot = async (baseFolder, fileName, page) => {
  const path = "results";
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
  await page.screenshot({ "path": `./${path}/${fileName}` });
}

const scrapeReservePage = async (page) => {
  return await page.evaluate(() => {
    const getTime = (index) => {
      switch (index) {
        case "1":
          return "07:00～09:00";
        case "2":
          return "09:00～11:00";
        case "3":
          return "011:00～13:00";
        case "4":
          return "013:00～15:00";
        case "5":
          return "015:00～17:00";
        case "6":
          return "017:00～19:00";
        case "7":
          return "019:00～21:00";
        default:
          return "値が不正"
      }
    }
    const tbodyArray = Array.from(document.querySelectorAll("tbody"));
    // 空いている日があるコートだけを抽出
    const targetTbodyArray = tbodyArray.filter((tbody) =>
      Array.from(tbody.querySelectorAll("td"))
        .filter(td => td.getAttribute("class") === "ok").length > 0);

    const result = [];
    targetTbodyArray.forEach(tbody => {
      const cortName = tbody.getElementsByTagName("th")[0].textContent;
      const emptyTimes = [];
      Array.from(tbody.querySelectorAll("td"))
        .filter(td => td.getAttribute("class") === "ok")
        .forEach(td => {
          const id = td.getAttribute("id");
          const index = id[id.length - 1];
          // 夜遅くは見ない
          if (index < 6) {
            emptyTimes.push(getTime(index))
          }
        });

      if (emptyTimes.length > 0) {
        result.push({ cortName, emptyTimes })
      }
    });
    const day = document.querySelector(".inner-block").querySelector("h3").textContent;
    return { day, result };
  });
}

const notExistsNextPage = async (page) => {
  return await page.evaluate(() => {
    const nextATag = Array.from(document.querySelector(".double.time-navigation").querySelectorAll("a")).filter(a => a.textContent === "次へ")[0];
    const href = nextATag.getAttribute("href");
    return !href
  });
}

const moveNextPage = async (page) => {
  await Promise.all([
    page.waitForNavigation({timeout: waitTime, waitUntil: "domcontentloaded"}),
    page.evaluate(() => {
      const nextATag = Array.from(document.querySelector(".double.time-navigation").querySelectorAll("a")).filter(a => a.textContent === "次へ")[0];
      nextATag.click();
    })
  ]);
}