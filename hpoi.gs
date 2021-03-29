var sheet_url = "";
var line_data_sheet_url = "";
var tg_channel_id = "";
var tg_bot_token = "";
//若有使用外部PaaS服務(如heroku)則需加入heroku的url
var herokuUrl = "";


function main() {
  var data = fetch_hpoi_data();

  if (typeof data === "undefined") {
    console.log("website error");
    return;
  }

  var last_data = get_last_data();
  var tokens = [];
  tokens = get_line_user_token();

  //比對資料
  var outputData = [];
  for (var i = 0; i < data.length; i++) {
    if (last_data.hobby_id === data[i].link_path && last_data.info_type === data[i].info_type && last_data.title === data[i].info_title) {
      console.log("same");
      console.log(data[i]);

      //如果第一筆資料和資料庫都沒變就不用進行下面動作了
      if (i === 0) {
        console.log("nothing changed");
        return;
      }

      break;
    }

    //把資料簡轉繁並fetch個別的tags
    var tmp = {
      link_path: data[i].link_path,
      info_type: LanguageApp.translate(data[i].info_type, 'zh_CN', "zh_TW"),
      info_title: LanguageApp.translate(data[i].info_title, 'zh_CN', "zh_TW"),
      img_path: data[i].img_path,
      tag: fetch_tags(data[i].link_path)
    }

    outputData.push(tmp);
  }

  //照時間順序排列
  outputData.reverse();

  //發送tg通知
  for (var i = 0; i < outputData.length; i++) {
    send_tg_notif(outputData[i]);
  }

  //寫入資料庫，因為line比較不穩，怕壞掉先寫入
  write_latest_data(data[0].link_path, data[0].info_type, data[0].info_title);


  //使用外部PaaS服務(如heroku)的方法，適用於人數較多的狀況
  /*for (var i = 0; i < outputData.length; i++) {
    heroku_send_line_notify(outputData[i]);
  }*/

  //發送line通知，人數少可使用此方法，另新增使用外部PaaS服務(如heroku)的方法於前一行
  for (var i = 0; i < outputData.length; i++) {

    //送line通知，人數多的話可能要找其他服務，因為google一天只給fetch兩萬次
    var flag = 0;
    for (var j = 0; j < tokens.length; j++) {
      var status = send_line_notify(outputData[i], tokens[j]);
      //如果使用者解除通知訂閱就把它從sheet裡刪掉
      if (status === "401") {
        var url = line_data_sheet_url + "?action=deleteByToken&deleteToken=" + tokens[j];
        const request_body = {
          'method': 'get'
        }
        UrlFetchApp.fetch(url, request_body);
        flag = 1;
      }
    }
    //有401發生就regresh一次token list
    if (flag) {
      tokens = get_line_user_token();
    }
  }


}


//使用外部PaaS服務(如heroku)的方法，適用於人數較多的狀況
function heroku_send_line_notify(outputData) {
  var res = UrlFetchApp.fetch(herokuUrl, {
    'contentType': 'application/json; charset=utf-8',
    'method': 'post',
    'payload': JSON.stringify({
      'output_data': outputData
    })
  });
  console.log(res.getContentText());
}


function fetch_hpoi_data() {
  var url = "https://www.hpoi.net/user/home/ajax";
  const request_body = {
    'method': 'post',
    'payload': {
      'page': 1,
      'type': 'info',
      'catType': 'all'
    }
  }

  var res;
  try {
    res = UrlFetchApp.fetch(url, request_body);
  } catch (error) {
    console.log(error);
    //time out
    if (error.toString().includes("504")) {
      console.log("504 occured");
      Utilities.sleep(5000);
      res = UrlFetchApp.fetch(url, request_body);
    }
    //bad gateway
    if (error.toString().includes("502")) {
      console.log("502 bad gateway");
      return;
    }
  }

  const html = res.getContentText();

  //hpoi的api暫時掛掉時好像會有"出錯了"的訊息
  if (html.includes("出错了!")) {
    return;
  }

  const $ = Cheerio.load(html);

  //抓link path
  var link_path = [];
  $('.overlay-container a[target="_blank"]').each(function () {
    link_path.push($(this).attr('href'));
  });
  // console.log(link_path);

  //抓title
  var info_title = [];
  $('.home-info-content .user-content').each(function () {
    info_title.push($(this).text().trim());
  });
  // console.log(info_title);

  //抓取情報類型
  var user_name = [];
  $('.home-info-content .user-name').each(function () {
    user_name.push($(this).text().trim().split(" ")[0].replace(/\n/g, ''));
  });

  //抓img
  var img_path = [];
  $('.overlay-container img').each(function () {
    var tmp = $(this).attr('src');
    if (tmp.indexOf('?') > 0) {
      tmp = tmp.split('?')[0];
    }
    img_path.push(tmp);
  });
  // console.log(img_path);

  var return_data = [];
  for (var i = 0; i < link_path.length; i++) {
    return_data.push({
      link_path: link_path[i],
      info_title: info_title[i],
      info_type: user_name[i],
      img_path: img_path[i]
    });
  }
  // console.log(return_data);

  return return_data;
}

function fetch_tags(link_path) {
  var url = "https://www.hpoi.net/" + link_path;
  const request_body = {
    'method': 'get'
  }
  var res = UrlFetchApp.fetch(url, request_body);
  const html = res.getContentText();
  const $ = Cheerio.load(html);

  //抓tags
  var tags = "";
  $('.col-md-17 table.info-box a[target="_blank"]').each(function () {
    var tmp = $(this).text();
    tmp = tmp.trim();
    //escape telegram invalid tag
    if (/^\d+\/\d+$/.test(tmp)) {
      tmp = tmp.replace('/', '比');
      tmp = tmp.replace('.', '點');
    }
    tmp = tmp.replace(/\s|\/|\.|-|：|:|-|（|）|＜|＞|@|·|~|\+|=|\||\{|\(|\)|}|\[|\]|\'|`|\*|・|\"|\&|～|\#|\”|\！|\―|\│|\▌|\。|\，|\、|\；|\？|\／|\＃|\〈|\〉|\×|\△|\☆|\＠|\－|\“/gi, '_').replace(/!/g, "");
    if (tmp !== "" && tmp !== "未知" && tmp !== "点击进入" && tmp !== "MFC") {
      //移除重複的"_"號
      tmp = remove_repeation_mark(tmp);
      //移除最後有出現"_"的tag
      if (tmp[tmp.length - 1] === "_") {
        tmp = tmp.slice(0, -1);
      }
      tags += ("#" + tmp);
    }
  });
  tags = LanguageApp.translate(tags, "zh_CN", "zh_TW");
  //google translate有時候會產出零寬間隔
  tags = tags.replace(/\u200b/g, "");
  tags = tags.replace(/#/g, " #");
  // console.log(tags);
  return tags;
}

function remove_repeation_mark(tmp) {
  var result = tmp[0];
  for (var i = 1; i < tmp.length; i++) {
    if (tmp[i] !== tmp[i - 1]) {
      result += tmp[i];
    }
    else if (tmp[i] !== "_") {
      result += tmp[i];
    }
  }
  return result;
}

function get_last_data() {
  const request_body = {
    'method': 'get'
  }
  var res = UrlFetchApp.fetch(sheet_url, request_body);

  console.log(res.getContentText());

  return JSON.parse(res.getContentText());
}

function write_latest_data(link_path, info_type, info_title) {
  const request_body = {
    'method': 'post',
    'payload': {
      hobby_id: link_path,
      info_type: info_type,
      title: info_title
    }
  }
  var res = UrlFetchApp.fetch(sheet_url, request_body);

  console.log(res.getContentText());
}

function send_tg_notif(data) {

  var url = "https://api.telegram.org/bot" + tg_bot_token + "/sendPhoto";
  var caption = "【" + data.info_type + "】\n" + "<a href=\"https://www.hpoi.net/" + data.link_path + "\">" + data.info_title + "</a>\n\nTags:" + data.tag;
  var request_body = {
    'method': 'post',
    'payload': {
      'chat_id': tg_channel_id,
      'parse_mode': "HTML",
      'caption': caption,
      'photo': data.img_path,
      'disable_web_page_preview': true,
      'disable_notification': true
    },
    'muteHttpExceptions': true
  }

  try {
    console.log("send tg notif");

    UrlFetchApp.fetch(url, request_body);

  } catch (error) {
    console.log(error);
    error = error.toString();
    if (error.includes("400")) {
      try {

        Utilities.sleep(500);
        console.log("retry after 400 error");
        UrlFetchApp.fetch(url, request_body);

      } catch (e) {
        console.log(e);
        e = e.toString();
        if (e.includes("400")) {
          url = "https://api.telegram.org/bot" + tg_bot_token + "/sendMessage";

          request_body = {
            'method': 'post',
            'payload': {
              'chat_id': tg_channel_id,
              'parse_mode': "HTML",
              'text': caption,
              'disable_web_page_preview': true,
              'disable_notification': true
            }
          }

          UrlFetchApp.fetch(url, request_body);
        }
      }
    }
  }
}

function send_line_notify(data, token) {
  try {
    var url = "https://notify-api.line.me/api/notify";

    var caption = "\n【" + data.info_type + "】\n" + data.info_title + "\nhttps://www.hpoi.net/" + data.link_path + "?openExternalBrowser=1\n\nTags:" + data.tag;

    const request_body = {
      'headers': {
        'Authorization': 'Bearer ' + token,
      },
      'method': 'post',
      'payload': {
        'message': caption,
        'imageThumbnail': data.img_path,
        'imageFullsize': data.img_path
      }
    }

    var res = UrlFetchApp.fetch(url, request_body);
    console.log(res.getContentText());

    if (res.getResponseCode() === 200) {
      return "200";
    }
    return "nothing";

  } catch (error) {
    console.log(error.toString());
    //使用者解除訂閱
    if (error.toString().includes("401") && error.toString().includes("Invalid access token")) {
      return "401";
    }
    //使用者沒有把line notify加入要接受通知的群組
    else if (error.toString().includes("400") && error.toString().includes("LINE Notify account doesn't join group which you want to send.")) {
      return "400";
    }
    return "exception";
  }
}

function get_line_user_token() {
  const request_body = {
    'method': 'get'
  }
  var res = UrlFetchApp.fetch(line_data_sheet_url + "?action=getAll", request_body);

  var tmp = JSON.parse(res.getContentText());

  return tmp;
}

//用來手動檢查token是否過期
function get_line_token_status() {
  var request_body = {
    'method': 'get'
  }
  var res = UrlFetchApp.fetch(line_data_sheet_url + "?action=getAll", request_body);
  var tmp = JSON.parse(res.getContentText());

  for (var i = 0; i < tmp.length; i++) {
    request_body = {
      'headers': {
        'Authorization': 'Bearer ' + tmp[i],
      },
      'method': 'get'
    }
    var url = "https://notify-api.line.me/api/status";
    try {
      var res = UrlFetchApp.fetch(url, request_body);
    } catch (error) {
      console.log(error.toString());
      //使用者解除訂閱
      if (error.toString().includes("401") && error.toString().includes("Invalid access token")) {
        console.log("401");
        var durl = line_data_sheet_url + "?action=deleteByToken&deleteToken=" + tmp[i];
        request_body = {
          'method': 'get'
        }
        UrlFetchApp.fetch(durl, request_body);
      }
      //使用者沒有把line notify加入要接受通知的群組
      else if (error.toString().includes("400") && error.toString().includes("LINE Notify account doesn't join group which you want to send.")) {
        console.log("400");
      }
    }
  }
}