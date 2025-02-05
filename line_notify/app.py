from flask import Flask, request
import os
import aiohttp
import json
import asyncio


app = Flask(__name__)

@app.route('/', methods=['POST', 'GET'])
async def index():
    if request.method == 'POST':
        output_data = request.get_json()
        data = output_data['output_data']

        async with aiohttp.ClientSession() as session:
            line_data_sheet = os.getenv('LINE_DATA_SHEET')
            async with session.get(f"{line_data_sheet}?action=getTokensAndKeys") as response:
                res_text = await response.text()
                userDatas = json.loads(res_text)

        async def send_line_notify(data, userData):
            async with aiohttp.ClientSession() as session:
                url = "https://notify-api.line.me/api/notify"
                caption = "\n【" + data["info_type"] + "】\n" + data["info_title"] + "\nhttps://www.hpoi.net/" + data["link_path"] + "?openExternalBrowser=1\n\nTags:" + data["tag"]
                header = {'Authorization': 'Bearer ' + userData['token']}
                outdata = {'message': caption, 'imageThumbnail': data["img_path"], 'imageFullsize': data["img_path"]}
                try:
                    async with session.post(url, headers=header, data=outdata) as resp:
                        return resp.status
                except aiohttp.ClientError:
                    return 500

        tasks = []
        for userData in userDatas:
            if userData['key'] != "":
                tmp = userData['key'].upper()
                arr = tmp.split(" ")
                isFound = 0
                isBlack = 0
                ct = 0
                for k in arr:
                    bk = ""
                    if k[0] == "!" or k[0] == "！":
                        bk = k[1:]
                        if(bk):
                            # 計算key中是否全為黑名單
                            ct += 1
                            if (bk in data["info_type"]) or (bk in data["info_title"].upper()) or (bk in data["tag"].upper()):
                                isBlack = 1
                    elif (k in data["info_type"]) or (k in data["info_title"].upper()) or (k in data["tag"].upper()):
                        isFound = 1
                # 關鍵字清單無符合，黑名單無符合，且有關鍵字清單內容 => 不傳送通知
                # 關鍵字清單無符合，黑名單有符合 => 不傳送通知
                if (isFound == 0 and isBlack == 0 and ct < len(arr)) or (isFound == 0 and isBlack == 1):
                    continue
            tasks.append(send_line_notify(data, userData))
            
        await asyncio.gather(*tasks)
        print("send line success")
        return 'send line success'

    if request.method == 'GET':
        print("gettt")
        return 'hello'

if __name__ == '__main__':
    app.run()
