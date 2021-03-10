from flask import *
import os
import requests
import json
import asyncio

line_data_sheet = ""

app = Flask(__name__)

@app.route('/', methods=['POST', 'GET'])
def index():
    if request.method == 'POST':
        loop = asyncio.get_event_loop()
        output_data = request.get_json()
        data = output_data['output_data']
        
        r = requests.get(line_data_sheet + "?action=getTokensAndKeys")
        userDatas = json.loads(r.text)

        async def send_line_notify(data, userData):
            url = "https://notify-api.line.me/api/notify"
            caption = "\n【" + data["info_type"] + "】\n" + data["info_title"] + "\nhttps://www.hpoi.net/" + data["link_path"] + "?openExternalBrowser=1\n\nTags:" + data["tag"]
            header = {'Authorization': 'Bearer ' + userData['token']}
            outdata = {'message': caption, 'imageThumbnail': data["img_path"], 'imageFullsize': data["img_path"]}
            res = await loop.run_in_executor(None, lambda: requests.post(url, headers=header, data=outdata))

        tasks = []
        for userData in userDatas:
            if userData['key'] != "":
                tmp = userData['key']
                arr = tmp.split(" ")
                isFound = 0
                for k in arr:
                    if (k in data["info_type"]) or (k in data["info_title"]) or (k in data["tag"]):
                        isFound = 1
                        break
                if isFound == 0:
                    continue
            task = loop.create_task(send_line_notify(data, userData))
            tasks.append(task)
            
        loop.run_until_complete(asyncio.wait(tasks))
        return f'send line success'

    if request.method == 'GET':
        print("gettt")
        return f'hello'

if __name__ == 'main':
    app.run()
