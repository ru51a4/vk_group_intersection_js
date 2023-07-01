import { VK } from 'vk-io';
import * as fs from 'fs';

const vk = new VK({
    token: "TOKEN"
});

async function run() {

    let getMembers = async (id) => {
        let res = [];
        let count = (await vk.api.groups.getMembers({
            group_id: id,
            offset: 0,
            count: 1000
        })).count;
        let i = 0;
        while (i <= count) {
            res.push(...(await vk.api.groups.getMembers({
                group_id: id,
                offset: i,
                count: 1000
            })).items);
            i += 1000;
        }
        console.log(id, "done")
        return res;
    }
    let getUserInfo = async (id) => {
        return await vk.api.users.get({
            user_ids: [id],
            fields: ["bdate", "sex", "photo_100", "relation"]
        });
    };

    //мерджем OR, а потом просто
    let input = "80473162 AND (86115925 OR 153262933 OR 79347443)"
    input = input;
    let check = async (str) => {
        str = str.split("");
        let stack = [[]];
        let t = '';
        while (str.length) {
            let next = () => {
                while (str.length) {
                    let t = str.shift();
                    if (t !== '\n' && t !== "\t") {
                        return t;
                    }
                }
            }
            let ch = next();
            if (ch === "(") {
                stack.push([]);
            } else if (ch === ")") {
                //
                stack[stack.length - 1].push(t);
                t = '';
                //
                let c = stack[stack.length - 1];
                stack.pop();
                stack[stack.length - 1].push(c);
            } else {
                if (ch == " ") {
                    stack[stack.length - 1].push(t);
                    t = '';
                } else {
                    t += ch;
                }

            }
        }
        if (t.length) {
            stack[stack.length - 1].push(t);
        }
        let calc = async (arr) => {

            for (let i = 0; i <= arr.length - 1; i++) {
                if (arr[i] === "OR") {
                    let left;
                    if (arr[i - 1]?.kek) {
                        left = arr[i - 1].kek;
                    } else {
                        left = await getMembers(arr[i - 1]);
                    }
                    let right;
                    if (arr[i + 1]?.kek) {
                        right = arr[i + 1].kek;
                    } else {
                        right = await getMembers(arr[i + 1]);
                    }
                    let or = [...left, ...right];
                    arr.splice(i - 1, 3, { kek: or });
                    i = i - 1;
                }
                if (arr[i] === "AND") {
                    let left;
                    if (arr[i - 1]?.kek) {
                        left = arr[i - 1].kek;
                    } else {
                        left = await getMembers(arr[i - 1]);
                    }
                    let right;
                    if (arr[i + 1]?.kek) {
                        right = arr[i + 1].kek;
                    } else {
                        right = await getMembers(arr[i + 1]);
                    }
                    let and = left.filter(value => right.includes(value));

                    arr.splice(i - 1, 3, { kek: and });
                    i = i - 1;
                }
            }
        }
        let deep = async (arr) => {
            for (let i = 0; i <= arr.length - 1; i++) {
                if (Array.isArray(arr[i])) {
                    if (arr[i].length === 1) {
                        arr[i] = arr[i][0];
                    } else {
                        await deep(arr[i]);
                        i = i - 1;
                    }
                }
            }
            await calc(arr);
        }
        await deep(stack[0]);
        return stack[0][0].kek;

    }
    let r = {
        "1": "не женат / не замужем",
        "2": "есть друг / есть подруга",
        "3": "помолвлен / помолвлена",
        "4": "женат / замужем",
        "5": "всё сложно",
        "6": "в активном поиске",
        "7": "влюблён / влюблена",
        "8": "в гражданском браке",
        "0": "не указано"
    }
    let ids = (await check(input));
    var stream = fs.createWriteStream("result.html");
    stream.once('open', async (fd) => {
        stream.write(`<html><body><ul style="display:flex; flex-wrap:wrap;">`);
        for (let i = 0; i <= ids.length - 1; i++) {
            let id = ids[i];
            let data = (await getUserInfo(id))[0];
            stream.write(`
            <li style="margin:10px; border:1px solid black;">
                <a href="https://vk.com/id${id}">
                    <img src="${data.photo_100}">
                </a>
                <br>
                ${(data.sex == 2 ? 'муж' : "жен")}
                <br>
                ${data.first_name} ${data.last_name}
                <br>
                ${data.bdate}
                <br>
                ${r[data.relation]}
                </li>`);
        }
        stream.end();
    });
}

run()
