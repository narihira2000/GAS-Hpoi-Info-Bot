const botToken = "";
const telegramDatasheetUrl = "";
const telegramApiUrl = "https://api.telegram.org";

function replyMsg(chatId, userMessage) {

  userMessage = userMessage.trim();
  let ins = userMessage.split(/\s+/);

  let replyText = "";
  let photoUrl = "";
  let replyMarkup = {
    "remove_keyboard": true
  };

  switch (ins[0]) {
    case ("/start"):
    case ("開始"):
    case ("開始使用"):
      replyText = "歡迎使用 Hpoi 模型情報訂閱機器人\n輸入「指令」或點擊以下按鈕查看相關功能。\n未新增關鍵字將不會進行推播。\n\n想收到所有模型資訊歡迎加入以下頻道: @HpoiInfoBig5";
      replyMarkup = {
        "resize_keyboard": true,
        "one_time_keyboard": true,
        "keyboard": [
          [
            {
              "text": "指令"
            }
          ]
        ]
      }
      break;
    case ("/add"):
    case ("新增"):
      if (ins.length > 1) {
        let arr = ins.slice(1);
        arr = arr.join(" ");
        let result = write_keyword(chatId, arr);
        replyText = result;
      }
      else {
        replyText = "新增資料為空，請輸入「指令」查看指令列表，或輸入「清單」查看已訂閱清單列表";
        replyMarkup = {
          "resize_keyboard": true,
          "one_time_keyboard": true,
          "keyboard": [
            [
              {
                "text": "指令"
              }
            ],
            [
              {
                "text": "清單"
              }
            ]
          ]
        }
      }
      break;
    case ("/delete"):
    case ("刪除"):
      if (ins.length > 1) {
        let arr = ins.slice(1);
        arr = arr.join(" ");
        result = delete_keyword(chatId, arr);
        replyText = result;
      }
      else {
        replyText = "刪除資料為空，請輸入「指令」查看指令列表，或輸入「清單」查看已訂閱清單列表";
        replyMarkup = {
          "resize_keyboard": true,
          "one_time_keyboard": true,
          "keyboard": [
            [
              {
                "text": "指令"
              }
            ],
            [
              {
                "text": "清單"
              }
            ]
          ]
        }
      }
      break;
    case ("/help"):
    case ("指令"):
      photoUrl = "https://i.imgur.com/KrSgcin.png";
      replyText = "[通知相關]\n開始：開始使用本服務\n取消訂閱：取消訂閱通知\n\n\n[關鍵字相關]\n新增 關鍵字：訂閱特定關鍵字\n刪除 關鍵字：刪除特定關鍵字\n範例：新增 預訂時間 鬼滅 !海賊 !粘土人\n\n※在關鍵字前加上驚嘆號可以把該字加入黑名單，推播規則如下圖\n※可一次輸入多筆，用空格隔開，送出後須等待約5秒才會回傳結果\n※輸入「技巧」查看設定關鍵字的小撇步\n\n全部刪除：一次清空清單列表\n\n\n[查詢相關]\n指令：查看可使用的指令\n技巧：查看設關鍵字小撇步\n清單：查看目前已訂閱的關鍵字清單\n※若清單為空則不會推播資訊，欲收到所有推播請訂閱以下頻道：@HpoiInfoBig5";
      replyMarkup = {
        "resize_keyboard": true,
        "one_time_keyboard": true,
        "keyboard": [
          [
            {
              "text": "技巧"
            }
          ],
          [
            {
              "text": "清單"
            }
          ]
        ]
      }
      break;
    case ("/list"):
    case ("清單"):
      result = get_key_list(chatId);
      if (result === "") {
        replyText = "清單為空，將不會收到推播通知，請使用「新增 關鍵字」指令來訂閱特定關鍵字";
      }
      else {
        replyText = "目前清單：\n" + result;
      }
      break;
    case ("/tips"):
    case ("技巧"):
      replyText = "因為情報來源為中國Hpoi手辦維基的網站，所以可能要注意幾點：\n1.  可使用較簡短的字詞來作為關鍵字\n例如：想收到咒術迴戰的情報，則設定「咒術」為關鍵字避免簡繁轉換變成「咒術回戰」而收不到情報\n\n2. 使用中國的譯名作為關鍵字\n例如：\n鋼彈→高達\n魔物獵人→怪物獵人\n不起眼女主角培育法→路人女主的養成方法\n\n3. 注意簡繁轉換後的字詞不同\n例如：\n黏土人→粘土人\n預定→預訂\n雷姆→蕾姆\n\n注意上述幾點應該就比較容易收到想要的情報了";
      break;
    case ("/delete_all"):
    case ("取消訂閱"):
    case ("全部刪除"):
      result = delete_all_keys(chatId);
      replyText = result;
      break;
    default:
      replyText = "請輸入「開始」或點擊選單的「開始使用」來進行更進一步的操作哦!\n也可以輸入「指令」查看指令列表";
      replyMarkup = {
        "resize_keyboard": true,
        "one_time_keyboard": true,
        "keyboard": [
          [
            {
              "text": "開始"
            }
          ],
          [
            {
              "text": "指令"
            }
          ]
        ]
      }
      break;
  }

  let url = `${telegramApiUrl}/bot${botToken}/sendMessage`;
  let request_body = {
    "method": "post",
    "contentType": 'application/json',
    "payload": JSON.stringify({
      "chat_id": parseInt(chatId),
      "parse_mode": "HTML",
      "text": replyText,
      "reply_markup": replyMarkup
    })
  };

  UrlFetchApp.fetch(url, request_body);

  if (photoUrl) {
    url = `${telegramApiUrl}/bot${botToken}/sendPhoto`;
    request_body = {
      "method": "post",
      "contentType": 'application/json',
      "payload": JSON.stringify({
        "chat_id": parseInt(chatId),
        "photo": photoUrl
      })
    }
    UrlFetchApp.fetch(url, request_body);
  }
}

function delete_all_keys(userId) {
  const request_body = {
    'method': 'post',
    'payload': {
      action: 'delete_all_keys',
      userId: userId
    }
  }
  var res = UrlFetchApp.fetch(telegramDatasheetUrl, request_body);

  console.log(res.getContentText());
  return res.getContentText();
}

function write_keyword(userId, key) {
  const request_body = {
    'method': 'post',
    'payload': {
      action: 'write_key_by_uid',
      userId: userId,
      keys: key
    }
  }
  var res = UrlFetchApp.fetch(telegramDatasheetUrl, request_body);

  console.log(res.getContentText());
  return res.getContentText();
}

function delete_keyword(userId, key) {
  const request_body = {
    'method': 'post',
    'payload': {
      action: 'delete_key_by_uid',
      userId: userId,
      keys: key
    }
  }
  var res = UrlFetchApp.fetch(telegramDatasheetUrl, request_body);

  console.log(res.getContentText());
  return res.getContentText();
}

function get_key_list(userId) {
  const request_body = {
    'method': 'get'
  }
  var res = UrlFetchApp.fetch(telegramDatasheetUrl + "?action=getKeysById&uid=" + userId, request_body);

  console.log(res.getContentText());
  return res.getContentText();
}

function doPost(e) {
  let msg = JSON.parse(e.postData.contents);
  Logger.log(msg);

  // 取出 chat_id 和發送的訊息文字
  let chatId = msg.message.chat.id.toString();
  let userMessage = msg.message?.text;

  if (!userMessage || !chatId) {
    return;
  }

  replyMsg(chatId, userMessage);
  return;
}
