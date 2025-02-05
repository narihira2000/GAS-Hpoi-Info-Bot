from flask import Flask, request
import os
import asyncio
import aiohttp
from typing import Dict, Any
import json

app = Flask(__name__)

@app.route('/', methods=['POST', 'GET'])
async def index():
    if request.method == 'POST':
        output_data: Dict[str, Any] = request.get_json()
        data = output_data['output_data']
        bot_token = os.getenv('BOT_TOKEN')
        print(output_data)

        async with aiohttp.ClientSession() as session:
            data_sheet_url = os.getenv('DATA_SHEET_URL')
            async with session.get(f"{data_sheet_url}?action=getChatIdAndKeys") as response:
                res_text = await response.text()
                userDatas = json.loads(res_text)

        async def send_notify(data: Dict[str, str], userData: Dict[str, str], bot_token: str) -> int:
            async with aiohttp.ClientSession() as session:
                url = f"https://api.telegram.org/bot{bot_token}/sendPhoto"
                caption = f"【{data['info_type']}】\n<a href=\"https://www.hpoi.net/{data['link_path']}\">{data['info_title']}</a>\n\nTags: {data['tag']}"
                if not data["link_path"]:
                    caption = f"【{data['info_type']}】\n{data['info_title']}\n\nTags: {data['tag']}"
                outdata = {
                    'chat_id': userData['chat_id'],
                    'photo': data["img_path"],
                    'caption': caption,
                    'parse_mode': 'HTML',
                    'disable_web_page_preview': True
                }

                try:
                    async with session.post(url, data=outdata) as resp:
                        if resp.status == 400:
                            error_text = await resp.text()
                            if "failed to get HTTP URL content" in error_text or "wrong file identifier/HTTP URL specified" in error_text:
                                url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
                                outdata = {
                                    'chat_id': userData['chat_id'],
                                    'text': caption,
                                    'parse_mode': 'HTML',
                                    'disable_web_page_preview': True
                                }
                                async with session.post(url, data=outdata) as text_resp:
                                    return text_resp.status
                        return resp.status
                except aiohttp.ClientError:
                    return 500

        tasks = []
        for userData in userDatas:
            if not userData['key']:
                continue
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
            tasks.append(send_notify(data, userData, bot_token))
        await asyncio.gather(*tasks)
        print("send tg success")
        return 'send tg success'

    if request.method == 'GET':
        print("gettt")
        return 'hello'

if __name__ == '__main__':
    app.run()
