const evaluate = async () => {
  const configuration = { interval: null };

  const limitReached = () => {
    const textLimit = document.querySelector(
      "#ip-fuse-limit-alert__header"
    )?.innerText;
    return (
      textLimit?.includes("reached the weekly invitation limit") ||
      textLimit?.includes("limite semanal")
    );
  };
  const findNextBatch = async () => {
    if (window.location.href.includes("/search/results/people")) {
      scroll(0, document.body.clientHeight);
      document
        .querySelector(
          '[aria-label="Next"],[aria-label="Avançar"], [aria-label="Show more results"] '
        )
        ?.click();
      return;
    }

    Array.from(
      document.querySelectorAll(`.abi-saved-contacts__contact-list > li`)
    ).forEach((e) => {
      const element = e.querySelector(
        '[aria-label="Connect"],[aria-label="Conectar"]'
      );
      if (element) return;
      return e.remove();
    });
  };

  const stopOperation = () => clearInterval(configuration.interval);
  window.stopOperation = stopOperation;
  const interact = () => {
    document
      .querySelector('[aria-label="Got it"],[aria-label="Okay"]')
      ?.click();
    const titleModal = document.getElementById("send-invite-modal")?.innerText;
    if (
      titleModal?.includes("How do you know") ||
      titleModal?.includes("Como você conhece")
    ) {
      document
        .querySelector('[aria-label="Other"],[aria-label="Outros"]')
        ?.click();
      document
        .querySelector('[aria-label="Connect"],[aria-label="Conectar"]')
        ?.click();
    }
    document
      .querySelector('[aria-label="Send now"], [aria-label="Enviar agora"]')
      ?.click();
    document
      .querySelector('[aria-label="Dismiss"],[aria-label="Cancelar"]')
      ?.click();
  };
  const getAllConnections = () =>
    Array.from(
      document.querySelectorAll('[id*="ember"] > span.artdeco-button__text')
    ).filter((e) => e.innerText === "Connect" || e.innerText === "Conectar");

  const connect = async () => {
    const allConnectionsIterator = getAllConnections()[Symbol.iterator]();
    const stopConnect = await new Promise((resolve) => {
      window.stopPromise = resolve;
      configuration.interval = setInterval(async () => {
        const { value, done } = allConnectionsIterator.next();
        console.log("Connection", value?.innerHTML);
        if (done) {
          stopOperation();
          return resolve(false);
        }
        //check if the click button results in a request to a server

        await new Promise((r) => setTimeout(r, 500));
        value.click();
        await new Promise((r) => setTimeout(r, 200));
        if (limitReached()) {
          stopOperation();
          return resolve(true);
        }
        interact();
      }, 1500);
    });
    console.log("Finished batch");
    if (stopConnect) return;

    await findNextBatch();
    await new Promise((r) => setTimeout(r, 3500));
    return connect();
  };

  await connect();
};

export { evaluate };
