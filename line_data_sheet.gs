var sheetId = "";

//寫入使用者的uid和accessToken和code
function doPost(e) {
  var params = e.parameter;
  var userId = params.userId;
  var accessToken = params.accessToken;
  var code = params.code;
  
  var SpreadSheet = SpreadsheetApp.openById(sheetId);
  var Sheet = SpreadSheet.getSheetByName("工作表1");

  var LastRow = Sheet.getLastRow();

  Sheet.getRange(LastRow + 1, 1).setValue(userId);
  Sheet.getRange(LastRow + 1, 2).setValue(accessToken);
  Sheet.getRange(LastRow + 1, 3).setValue(code);

  return ContentService.createTextOutput("success");
}

function doGet(e) {
  var params = e.parameter;
  var action = params.action;

  var SpreadSheet = SpreadsheetApp.openById(sheetId);
  var Sheet = SpreadSheet.getSheetByName("工作表1");

  var LastRow = Sheet.getLastRow();

  switch (action) {
    //回傳所有用戶的accessToken
    case ("getAll"):
      var output = [];


      for (var i = 2; i <= LastRow; i++) {
        var at = Sheet.getRange(i, 2).getValue();
        if (at) {
          output.push(at);
        }
      }

      console.log(output);
      return ContentService.createTextOutput(JSON.stringify(output));
      break;
    //依accessToken刪除該row
    case ("deleteByToken"):
      var deleteToken = params.deleteToken;
      for (var i = 2; i <= LastRow; i++) {
        var at = Sheet.getRange(i, 2).getValue();
        if (at === deleteToken) {
          Sheet.deleteRow(i);
          return ContentService.createTextOutput(deleteToken + " deleted");
          break;
        }
      }
      return ContentService.createTextOutput("not found");
      break;
    //依accessToken得到uid
    case ("getUid"):
      var token = params.token;
      for (var i = 2; i <= LastRow; i++) {
        var at = Sheet.getRange(i, 2).getValue();
        if (at === token) {
          var uid = Sheet.getRange(i, 1).getValue();
          return ContentService.createTextOutput(uid);
          break;
        }
      }
      return ContentService.createTextOutput("not found");
      break;
    default:
      return ContentService.createTextOutput("error");
      break;
  }
}
