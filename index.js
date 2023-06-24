import { VK } from 'vk-io';

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
        return res;
    }

    //мерджем OR, а потом просто
    let input = "26863530 AND (153262933 AND 64135965)"
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

                    console.log({ and })
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
    console.log(await check(input));
}

run()