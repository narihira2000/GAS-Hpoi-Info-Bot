const sheetId = "";

function doPost(e) {
  let params = e.parameter;

  let SpreadSheet = SpreadsheetApp.openById(sheetId);
  let Sheet = SpreadSheet.getSheetByName("工作表1");

  let LastRow = Sheet.getLastRow();

  let action = params.action;
  let userId = parseInt(params.userId);

  switch (action) {
    case ("write_key_by_uid"): {
      let key = params.keys;
      let keys = key.split(" ");
      let flag = 0;

      for (let i = 2; i <= LastRow; i++) {
        let uid = Sheet.getRange(i, 1).getValue();
        if (userId === uid) {
          let origKey = Sheet.getRange(i, 2).getValue();
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
          Sheet.getRange(i, 2).setValue(origKey);
        }
      }
      if (!flag) {
        Sheet.appendRow([userId, key + " "]);
      }
      return ContentService.createTextOutput("新增成功");
    }
    case ("delete_key_by_uid"): {
      let key = params.keys;
      let keys = key.split(" ");
      let flag = 0;
      let isFound = 0;

      for (let i = 2; i <= LastRow; i++) {
        let uid = Sheet.getRange(i, 1).getValue();
        if (parseInt(userId) === uid) {
          flag = 1;
          let origKey = Sheet.getRange(i, 2).getValue();
          origKey = origKey.trim();
          let origKeyArr = origKey.split(" ");
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
          Sheet.getRange(i, 2).setValue(write);
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
        return ContentService.createTextOutput("查無使用者資料，請先新增關鍵字");
      }
    }
    case ("delete_all_keys"): {
      let flag = 0;

      for (let i = 2; i <= LastRow; i++) {
        let uid = Sheet.getRange(i, 1).getValue();
        if (userId === uid) {
          flag = 1;
          Sheet.getRange(i, 2).setValue("");
        }
      }
      if (flag) {
        return ContentService.createTextOutput("刪除成功，目前清單內無任何東西");
      }
      else {
        return ContentService.createTextOutput("查無使用者資料，請先新增關鍵字");
      }
    }
    default: {
      break;
    }
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
    case ("getAll"): {
      let output = [];
      for (let i = 2; i <= LastRow; i++) {
        let at = Sheet.getRange(i, 1).getValue();
        if (at) {
          output.push(at);
        }
      }

      console.log(output);
      return ContentService.createTextOutput(JSON.stringify(output));
    }
    case ("getChatIdAndKeys"):
      let output = [];
      for (let i = 2; i <= LastRow; i++) {
        let at = Sheet.getRange(i, 1).getValue();
        let k = Sheet.getRange(i, 2).getValue();
        k = k.trim();
        if (at) {
          output.push({
            chat_id: at,
            key: k
          });
        }
      }

      console.log(output);
      return ContentService.createTextOutput(JSON.stringify(output));
    case ("getKeysById"): {
      let uid = parseInt(params.uid);
      for (let i = 2; i <= LastRow; i++) {
        let userId = Sheet.getRange(i, 1).getValue();
        if (userId === uid) {
          let key = Sheet.getRange(i, 2).getValue();
          key = key.trim();
          return ContentService.createTextOutput(key);
        }
      }
      return ContentService.createTextOutput("查無使用者資料，請先新增關鍵字");
    }
    default: {
      return ContentService.createTextOutput("error");
    }
  }

}
