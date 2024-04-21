const API_URL = "/api";
const EXECUTE_URL = API_URL + "/execute";
async function postRequest(url, data) {

    const result = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    }).then((res) => res.json()).then((data) =>
        JSON.stringify(data, null, 2)
    ).catch((err) => {
        console.error("Error:", err);
        return `${err.name}: ${err.message}`;
    });
    return result;
}
async function getRequest(url) {
    const result = await fetch(url).then((res) => res.json()).then((data) =>
        JSON.stringify(data, null, 2)
    ).catch((err) => {
        console.error("Error:", err);
        return `${err.name}: ${err.message}`;
    });
    return result;
}
window.onload = () => {
    document.getElementById("executeBtn").onclick = async () => {
        const code = document.getElementById("code").value;
        const result = await postRequest(EXECUTE_URL, { code });

        document.getElementById("output").innerText = result;
    };

    document.getElementById("clearBtn").onclick = () => {
        document.getElementById("output").innerText = "";
        document.getElementById("code").value = "";
    }

    document.getElementById("infoBtn").onclick = async () => {
        const result = await getRequest(API_URL);
        document.getElementById("output").innerText = result;
    }
    document.getElementById("healthBtn").onclick = async () => {
        const result = await getRequest(API_URL + "/health");
        document.getElementById("output").innerText = result;
    }
    document.getElementById("netcheckBtn").onclick = async () => {
        const result = await getRequest(API_URL + "/netcheck");
        document.getElementById("output").innerText = result;
    }
}