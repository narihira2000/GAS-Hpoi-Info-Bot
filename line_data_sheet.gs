const sheetId = "";

//寫入使用者的uid和accessToken和code
function doPost(e) {
  let params = e.parameter;
  let SpreadSheet = SpreadsheetApp.openById(sheetId);
  let Sheet = SpreadSheet.getSheetByName("工作表1");

  let LastRow = Sheet.getLastRow();

  let action = params.action;

  switch (action) {
    //寫入使用者資料
    case ("write_user_data"): {
      let userId = params.userId;
      let accessToken = params.accessToken;
      let code = params.code;

      Sheet.getRange(LastRow + 1, 1).setValue(userId);
      Sheet.getRange(LastRow + 1, 2).setValue(accessToken);
      Sheet.getRange(LastRow + 1, 3).setValue(code);
      break;
    }
    //根據userid寫入訂閱關鍵字
    case ("write_key_by_uid"): {
      let key = params.keys;
      let keys = key.split(" ");
      let userId = params.userId;
      let flag = 0;

      //找是否有符合的userid
      for (let i = 2; i <= LastRow; i++) {
        let uid = Sheet.getRange(i, 1).getValue();
        if (userId === uid) {
          let origKey = Sheet.getRange(i, 4).getValue();
          //檢查關鍵字是否有重複，有重複就不用
          for (let j = 0; j < keys.length; j++) {
            if (!(origKey.includes(keys[j]))) {
              origKey = origKey + (keys[j] + " ");
            }
            else {
              let tmp = origKey.trim();
              let origKeyArr = tmp.split(" ");
              let index = origKeyArr.indexOf(keys[j]);
              if (index < 0) {
                origKey = origKey + (keys[j] + " ");
              }
            }
          }
          flag = 1;
          Sheet.getRange(i, 4).setValue(origKey);
        }
      }
      if (flag) {
        return ContentService.createTextOutput("新增成功");
      }
      else {
        return ContentService.createTextOutput("查無使用者資料，請先訂閱通知，謝謝!");
      }
      break;
    }
    //根據userid刪除訂閱關鍵字
    case ("delete_key_by_uid"): {
      let key = params.keys;
      let keys = key.split(" ");
      let userId = params.userId;
      let flag = 0;
      let isFound = 0;

      for (let i = 2; i <= LastRow; i++) {
        let uid = Sheet.getRange(i, 1).getValue();
        if (userId === uid) {
          flag = 1;
          let origKey = Sheet.getRange(i, 4).getValue();
          origKey = origKey.trim();
          let origKeyArr = origKey.split(" ");
          //檢查關鍵字，有全部一致的才刪除
          for (let j = 0; j < keys.length; j++) {
            if (origKey.includes(keys[j])) {
              let index = origKeyArr.indexOf(keys[j]);
              if (index > -1) {
                origKeyArr.splice(index, 1);
                isFound = 1;
              }
            }
          }
          let write = "";
          if (origKeyArr.length > 0) {
            write = origKeyArr.join(" ");
            write = write + " ";
          }
          Sheet.getRange(i, 4).setValue(write);
        }
      }
      if (flag) {
        if (isFound) {
          return ContentService.createTextOutput("刪除成功");
        }
        else {
          return ContentService.createTextOutput("找不到欲刪除的關鍵字，請重新確認，可輸入「清單」來查看已訂閱指令");
        }
      }
      else {
        return ContentService.createTextOutput("查無使用者資料，請先訂閱通知，謝謝!");
      }
      break;
    }
    case ("delete_all_keys"): {
      let userId = params.userId;
      let flag = 0;

      for (let i = 2; i <= LastRow; i++) {
        let uid = Sheet.getRange(i, 1).getValue();
        if (userId === uid) {
          flag = 1;
          Sheet.getRange(i, 4).setValue("");
        }
      }
      if (flag) {
        return ContentService.createTextOutput("刪除成功，目前清單內無任何東西");
      }
      else {
        return ContentService.createTextOutput("查無使用者資料，請先訂閱通知，謝謝!");
      }
      break;
    }
    default:
      break;
  }


  return ContentService.createTextOutput("success");
}

function doGet(e) {
  let params = e.parameter;
  let action = params.action;

  let SpreadSheet = SpreadsheetApp.openById(sheetId);
  let Sheet = SpreadSheet.getSheetByName("工作表1");

  let LastRow = Sheet.getLastRow();

  switch (action) {
    //回傳所有用戶的accessToken
    case ("getAll"): {
      let output = [];


      for (let i = 2; i <= LastRow; i++) {
        let at = Sheet.getRange(i, 2).getValue();
        if (at) {
          output.push(at);
        }
      }

      console.log(output);
      return ContentService.createTextOutput(JSON.stringify(output));
      break;
    }
    //得到所有accessToken和訂閱關鍵字的組合
    case ("getTokensAndKeys"): {
      let output = [];
      for (let i = 2; i <= LastRow; i++) {
        let at = Sheet.getRange(i, 2).getValue();
        let k = Sheet.getRange(i, 4).getValue();
        k = k.trim();
        if (at) {
          output.push({
            token: at,
            key: k
          });
        }
      }
      return ContentService.createTextOutput(JSON.stringify(output));
      break;
    }
    //依accessToken刪除該row
    case ("deleteByToken"): {
      let deleteToken = params.deleteToken;
      for (let i = 2; i <= LastRow; i++) {
        let at = Sheet.getRange(i, 2).getValue();
        if (at === deleteToken) {
          Sheet.deleteRow(i);
          return ContentService.createTextOutput(deleteToken + " deleted");
          break;
        }
      }
      return ContentService.createTextOutput("not found");
      break;
    }
    //依accessToken得到uid
    case ("getUid"): {
      let token = params.token;
      for (let i = 2; i <= LastRow; i++) {
        let at = Sheet.getRange(i, 2).getValue();
        if (at === token) {
          let uid = Sheet.getRange(i, 1).getValue();
          return ContentService.createTextOutput(uid);
          break;
        }
      }
      return ContentService.createTextOutput("not found");
      break;
    }
    //依uid得到訂閱的關鍵字
    case ("getKeysById"): {
      let uid = params.uid;
      for (let i = 2; i <= LastRow; i++) {
        let userId = Sheet.getRange(i, 1).getValue();
        if (userId === uid) {
          let key = Sheet.getRange(i, 4).getValue();
          key = key.trim();
          return ContentService.createTextOutput(key);
          break;
        }
      }
      return ContentService.createTextOutput("not found");
      break;
    }
    default:
      return ContentService.createTextOutput("error");
      break;
  }
}
