import { VK } from 'vk-io';
import * as fs from 'fs';
import bracketParser from 'brackets-parser';

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
        let arg = {
            "OR": async (left, right) => {
                if (left?.kek) {
                    left = left.kek;
                } else {
                    left = await getMembers(left);
                }
                if (right?.kek) {
                    right = right.kek;
                } else {
                    right = await getMembers(right);
                }
                return [...left, ...right];
            },
            "AND": async (left, right) => {
                if (left?.kek) {
                    left = left.kek;
                } else {
                    left = await getMembers(left);
                }
                if (right?.kek) {
                    right = right.kek;
                } else {
                    right = await getMembers(right);
                }
                return left.filter(value => right.includes(value));
            }
        };
        let stack = await bracketParser.parse(str, arg);
        return stack[0].kek;
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
