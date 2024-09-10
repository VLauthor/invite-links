const updateAccessToken = () => {
  console.log(1);

  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("refreshToken")}`,
    },
  };
  fetch("http://localhost:3001/api/token/update", requestOptions)
    .then((res) => {
      if (res.status != 201) window.location.href = "/login";
      return res.json();
    })
    .then((data) => {
      localStorage.setItem("accessToken", data.access);
    });
};
document
  .getElementById("createLinkBut")
  .addEventListener("click", function (event) {
    const requestOptions = {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    };
    fetch("http://localhost:3001/api/links/create", requestOptions)
      .then((res) => {
        if (res.status == 401) {
          updateAccessToken();
        }
        return res.json();
      })
      .then((json) => {
        const but = document.getElementById("createLinkBut");
        but.style.display = "none";
        const inviteDiv = document.getElementById("invite");
        inviteDiv.innerHTML = "";
        const itemOne = document.createElement("a");
        const itemTwo = document.createElement("div");
        itemOne.classList.add("item");
        itemTwo.classList.add("item");
        itemOne.textContent = json.url;
        itemTwo.textContent = "Регистрации: 0";
        const row = document.createElement("div");
        row.classList.add("row");
        row.appendChild(itemOne);
        row.appendChild(itemTwo);
        inviteDiv.appendChild(row);
      });
  });
document
  .getElementById("inviteBut")
  .addEventListener("click", function (event) {
    console.log(1);
    const boxInvite = document.getElementById("invite");
    const boxLessens = document.getElementById("lessens");
    boxInvite.classList.remove("off");
    if (!boxLessens.classList.contains("off")) boxLessens.classList.add("off");
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    };
    fetch("http://localhost:3001/api/links/my", requestOptions)
      .then((response) => {
        if (response.status == 401) {
          updateAccessToken();
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        if (data.url != null) {
          const but = document.getElementById("createLinkBut");
          if (but.style.display != "none") but.style.display = "none";
          const inviteDiv = document.getElementById("invite");
          inviteDiv.innerHTML = "";
          const itemOne = document.createElement("a");
          const itemTwo = document.createElement("div");
          itemOne.classList.add("item");
          itemTwo.classList.add("item");
          itemOne.textContent = data.url;
          const array = data.users;
          itemTwo.textContent = "Регистрации: " + array.length;
          const row = document.createElement("div");
          row.classList.add("row");
          row.appendChild(itemOne);
          row.appendChild(itemTwo);
          inviteDiv.appendChild(row);
          const containerScroll = document.createElement("div");
          containerScroll.classList.add("scrollContainer");
          for (let i = 0; i < array.length; i++) {
            const itemLi = document.createElement("div");
            itemLi.classList.add("item");
            itemLi.textContent = "ФИО: " + array[i];
            containerScroll.append(itemLi);
          }
          inviteDiv.append(containerScroll);
        }
      });
  });
document
  .getElementById("lessensBut")
  .addEventListener("click", function (event) {
    const boxInvite = document.getElementById("invite");
    const boxLessens = document.getElementById("lessens");
    boxLessens.classList.remove("off");
    if (!boxInvite.classList.contains("off")) boxInvite.classList.add("off");
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    };
    fetch("http://localhost:3001/api/videos/all", requestOptions)
      .then((res) => {
        if (res.status != 202) updateAccessToken();
        return res.json();
      })
      .then((data) => {
        const scrollContainer = document.createElement("div");
        boxLessens.innerHTML = "";
        scrollContainer.classList.add("scrollContainer");
        const duableItems = [];
        let duableItem;
        let j = 0;

        for (let i = 0; i < data.videos.length; i++) {
          if (i % 2 === 0) {
            if (duableItem) {
              duableItems.push(duableItem);
              scrollContainer.appendChild(duableItem);
            }
            duableItem = document.createElement("div");
            duableItem.classList.add("duableItem");
            j++;
          }

          const item = document.createElement("div");
          item.classList.add("item");

          if (data.videos[i].accept) {
            item.innerText = data.videos[i].name + " (приобретено)";
            item.addEventListener("click", (event) => {
              window.open(data.videos[i].url, "_blank");
            });
          } else {
            item.innerText = data.videos[i].name + " (не приобретено)";
            item.addEventListener("click", (event) => {
              const owerllay = document.getElementById("owerllay");
              owerllay.classList.remove("off");
              const desc = owerllay.querySelector("#desc");
              const id = owerllay.querySelector("#id");
              id.value = data.videos[i].id;
              desc.innerText = `Покупка видеоролика "${data.videos[i].name}"`;
            });
          }
          duableItem.appendChild(item);
          if (i === data.videos.length - 1) {
            duableItems.push(duableItem);
            scrollContainer.appendChild(duableItem);
          }
        }
        const lessens = document.getElementById("lessens");
        lessens.appendChild(scrollContainer);
      });
  });
document.getElementById("closeBut").addEventListener("click", (event) => {
  const owerllay = document.getElementById("owerllay");
  owerllay.classList.add("off");
});

document.querySelector("form").addEventListener("submit", function (event) {
  event.preventDefault();
  let form = document.querySelector("form");
  let formData = new FormData(form);
  let xhr = new XMLHttpRequest();
  xhr.open("post", form.action, true);
  xhr.setRequestHeader(
    "Authorization",
    "Bearer " + localStorage.getItem("accessToken")
  );
  xhr.onload = function () {
    if (xhr.status === 202) {
      console.log(2);
      alert("Успешно");

      const owerllay = document.getElementById("owerllay");
      owerllay.classList.add("off");
      const lessens = document.getElementById("lessens");
      lessens.classList.add("off");
    } else {
      console.log(3);

      updateAccessToken();
      alert("Повторите попытку");
    }
  };
  xhr.onerror = function () {
    console.log("Ошибка сети");
  };
  xhr.send(formData);
});
