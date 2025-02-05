const channelToken = "";
const client_id = "";
const client_secret = "";
const line_data_sheet_url = "";
//redirect_uri存line_bot.gs的網頁應用程式網址
const redirect_uri = "";
const bitly_token = "";
const bitly_group_guid = "";

function getBitlyUrl(longUrl) {
  let apiUrl = "https://api-ssl.bitly.com/v4/shorten";
  const request_body = {
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + bitly_token,
    },
    'method': 'post',
    'payload': JSON.stringify({
      "group_guid": bitly_group_guid,
      "domain": "bit.ly",
      "long_url": longUrl
    })
  }
  let res = UrlFetchApp.fetch(apiUrl, request_body);
  if (res.getResponseCode() === 200) {
    let data = JSON.parse(res.getContentText());
    console.log(data.link);
    return data.link;
  }
  else {
    return longUrl;
  }
}

function replyMsg(replyToken, userMessage, userId) {

  userMessage = userMessage.trim();
  let ins = userMessage.split(/\s+/);
  let replyText = "123";
  let replyUrl = "https://notify-bot.line.me/oauth/authorize?response_type=code&client_id=" + client_id + "&redirect_uri=" + redirect_uri + "&scope=notify&state=" + userId;
  let arr;
  let result;

  //根據使用者輸入的內容回傳訊息
  switch (ins[0]) {
    case ("開始"):
    case ("開始使用"):
      let shortUrl = getBitlyUrl(replyUrl);
      replyText = "請點擊以下連結來註冊 Line Notify 通知\n注意!按下同意連動後要等一下才會跳轉成功畫面，按兩次會重複訂閱\n若 Line Notify出現兩則「連動完成」的通知，請記得解除其中一個，感謝~\n\n" + shortUrl;
      break;
    case ("取消訂閱"):
      replyText = "請點擊以下連結來解除通知連動\n\nhttps://notify-bot.line.me/my/";
      break;
    case ("新增"):
      if (ins.length > 1) {
        arr = ins.slice(1);
        arr = arr.join(" ");
        result = write_keyword(userId, arr);
        replyText = result;
      }
      else {
        replyText = "新增資料為空，請輸入「指令」查看指令列表，或輸入「清單」查看已訂閱清單列表";
      }
      break;
    case ("刪除"):
      if (ins.length > 1) {
        arr = ins.slice(1);
        arr = arr.join(" ");
        result = delete_keyword(userId, arr);
        replyText = result;
      }
      else {
        replyText = "刪除資料為空，請輸入「指令」查看指令列表，或輸入「清單」查看已訂閱清單列表";
      }
      break;
    case ("指令"):
      replyText = "[通知相關]\n開始：開始使用本服務\n取消訂閱：取消訂閱通知\n\n\n[關鍵字相關]\n新增 關鍵字：訂閱特定關鍵字\n刪除 關鍵字：刪除特定關鍵字\n範例：新增 預訂時間 鬼滅 !海賊 !粘土人\n\n※在關鍵字前加上驚嘆號可以把該字加入黑名單，推播規則:  https://i.imgur.com/KrSgcin.png \n※可一次輸入多筆，用空格隔開，送出後須等待約5秒才會回傳結果\n※輸入「技巧」查看設定關鍵字的小撇步\n\n全部刪除：一次清空清單列表\n\n\n[查詢相關]\n指令：查看可使用的指令\n技巧：查看設關鍵字小撇步\n清單：查看目前已訂閱的關鍵字清單\n※若清單為空則會推播所有資訊";
      break;
    case ("清單"):
      result = get_key_list(userId);
      if (result === "") {
        replyText = "清單為空，將收到所有推播通知，請使用「新增 關鍵字」指令來訂閱特定關鍵字";
      }
      else {
        replyText = "目前清單：\n" + result;
      }
      break;
    case ("技巧"):
      replyText =  "因為情報來源為中國Hpoi手辦維基的網站，所以可能要注意幾點：\n1.  可使用較簡短的字詞來作為關鍵字\n例如：想收到咒術迴戰的情報，則設定「咒術」為關鍵字避免簡繁轉換變成「咒術回戰」而收不到情報\n\n2. 使用中國的譯名作為關鍵字\n例如：\n鋼彈→高達\n魔物獵人→怪物獵人\n不起眼女主角培育法→路人女主的養成方法\n\n3. 注意簡繁轉換後的字詞不同\n例如：\n黏土人→粘土人\n預定→預訂\n雷姆→蕾姆\n\n注意上述幾點應該就比較容易收到想要的情報了";
      break;
    case ("全部刪除"):
      result = delete_all_keys(userId);
      replyText = result;
      break;
    default:
      replyText = "請輸入「開始」或點擊選單的「開始使用」來進行更進一步的操作哦!\n也可以輸入「指令」查看指令列表";
  }

  let url = 'https://api.line.me/v2/bot/message/reply';
  UrlFetchApp.fetch(url, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + channelToken,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': replyToken,
      'messages': [{
        'type': 'text',
        'text': replyText,
      }],
    }),
  });
}

function delete_all_keys(userId){
  const request_body = {
    'method': 'post',
    'payload': {
      action: 'delete_all_keys',
      userId: userId
    }
  }
  let res = UrlFetchApp.fetch(line_data_sheet_url, request_body);

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
  let res = UrlFetchApp.fetch(line_data_sheet_url, request_body);

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
  let res = UrlFetchApp.fetch(line_data_sheet_url, request_body);

  return res.getContentText();
}

function get_key_list(userId) {
  const request_body = {
    'method': 'get'
  }
  let res = UrlFetchApp.fetch(line_data_sheet_url + "?action=getKeysById&uid=" + userId, request_body);

  return res.getContentText();
}

function write_user_data(userId, accessToken, code) {
  const request_body = {
    'method': 'post',
    'payload': {
      action: 'write_user_data',
      userId: userId,
      accessToken: accessToken,
      code: code
    }
  }
  let res = UrlFetchApp.fetch(line_data_sheet_url, request_body);

  console.log(res.getContentText());
}

//透過code和user來獲得access token
function get_token(code) {
  let url = "https://notify-bot.line.me/oauth/token";
  const request_body = {
    'method': 'post',
    'payload': {
      "grant_type": "authorization_code",
      "code": code,
      "redirect_uri": redirect_uri,
      "client_id": client_id,
      "client_secret": client_secret
    }
  }
  let res = UrlFetchApp.fetch(url, request_body);
  let data = JSON.parse(res.getContentText());

  console.log(data.access_token);
  return data.access_token;
}

//line notify完成連動後redirect回的地方
function doGet(e) {
  let params = e.parameter;
  let code = params.code;
  let state = params.state;
  console.log(code, state);

  let access_token = get_token(code);

  if (typeof access_token === "undefined") {
    return ContentService.createTextOutput("發生錯誤，請稍後再試!");
  }
  else {
    write_user_data(state, access_token, code);

    return ContentService.createTextOutput("已完成通知註冊，請關閉此網頁!!");
  }
}

//接收使用者送的訊息
function doPost(e) {

  let msg = JSON.parse(e.postData.contents);
  Logger.log(msg);

  // 取出 replayToken 和發送的訊息文字
  let replyToken = msg.events[0].replyToken;
  let userMessage = msg.events[0].message.text;
  let userId = msg.events[0].source.userId;

  if (typeof replyToken === 'undefined') {
    return;
  }

  replyMsg(replyToken, userMessage, userId);

}
