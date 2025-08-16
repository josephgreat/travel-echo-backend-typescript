main();

async function main() {
  await getBadges();
  initForm();
}

function initForm() {
  const form = document.querySelector("form");
  form.addEventListener("submit", handleSubmit);

  /**
   *
   * @param {Event} event
   */
  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    const body = JSON.stringify(Object.fromEntries(formData.entries()));
    console.log(JSON.parse(body));
    startLoading();
    try {
      const res = await fetch("/api/v1/badges", {
        headers: {
          "Content-Type": "application/json"
        },
        method: "post",
        body
      });
      const data = await res.json();
      console.log(data);

      if (!data.success) {
        throw new Error(data.message);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      stopLoading();
    }
  }
}

function startLoading() {
  const loader = document.querySelector(".loader-bg");
  if (loader) {
    loader.style.display = "flex";
  }
}

function stopLoading() {
  const loader = document.querySelector(".loader-bg");
  if (loader) {
    loader.style.display = "none";
  }
}

async function getBadges() {
  startLoading();
  try {
    const res = await fetch("/api/v1/badges");
    const data = await res.json();
    console.log(data);
    renderBadges(data);
  } catch (error) {
    alert(`Error loading badges: ${error.message}`);
  } finally {
    stopLoading();
  }
}

function renderBadges(badges) {
  console.log("Bagdes", badges);
}
