// Interactive terminal for the home page.
// Each <div class="block" data-cmd="..."> holds the content a command prints.
(function () {
  const output = document.getElementById("output");
  const form = document.getElementById("cmdline");
  const input = document.getElementById("cmd");
  const screen = document.querySelector(".screen");
  if (!output || !form || !input) return;

  const FILES = [
    "experience.log",
    "education.txt",
    "skills.conf",
    "courses/",
    "certs/",
  ];

  // command (or alias) -> block name
  const BLOCKS = {
    whoami: "whoami",
    experience: "experience",
    exp: "experience",
    "cat experience.log": "experience",
    education: "education",
    edu: "education",
    "cat education.txt": "education",
    courses: "courses",
    "ls courses": "courses",
    "ls courses/": "courses",
    certs: "certs",
    certifications: "certs",
    "ls certs": "certs",
    "ls certs/": "certs",
    skills: "skills",
    "cat skills.conf": "skills",
    contact: "contact",
  };

  // Three hand-drawn frames: upright, leaning right, leaning left.
  const HAND_UP = String.raw`        _ _ _ _
       | | | | |
       | | | | |
       | | | | |
    _  |       |
   ( \ |       |
    \ \|       |
     \         /
      \       /
       |     |`;
  const HAND_RIGHT = String.raw`            _ _ _ _
           / / / / /  ))
          / / / / /  ))
         / / / / /
     _  /       /
    ( \ /       /
     \ \/       /
     \         /
      \       /
       |     |`;
  const HAND_LEFT = String.raw`    _ _ _ _
(( \ \ \ \ \
((  \ \ \ \ \
     \ \ \ \ \
   _  \       \
  ( \ \       \
   \ \\       \
     \         |
      \       /
       |     |`;

  const HELP = [
    ["hello", "wave hello again"],
    ["whoami", "who I am"],
    ["experience", "where I've worked"],
    ["education", "my degree"],
    ["courses", "courses & bootcamps"],
    ["certs", "certifications"],
    ["skills", "tools & languages"],
    ["contact", "how to reach me"],
    ["ls", "list files"],
    ["clear", "clear the screen"],
  ];

  const COMPLETIONS = [
    ...HELP.map(([c]) => c),
    "help",
    "history",
    "pwd",
    "date",
    "echo",
    ...FILES.map((f) => (f.endsWith("/") ? "ls " + f : "cat " + f)),
  ];

  const history = [];
  let histPos = 0;

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function promptLine(cmd) {
    const p = el("p", "prompt");
    p.append(el("span", "user", "sabiq@sec"), ":", el("span", "path", "~"));
    p.append("$ " + cmd);
    output.append(p);
  }

  function print(text, cls) {
    const out = el("div", "out" + (cls ? " " + cls : ""));
    out.append(el("p", null, text));
    output.append(out);
    return out;
  }

  function cmdLink(cmd, label) {
    const a = el("button", "cmd-link", label || cmd);
    a.type = "button";
    a.addEventListener("click", () => run(cmd));
    return a;
  }

  function showBlock(name) {
    const block = document.querySelector('.block[data-cmd="' + name + '"]');
    if (!block) return;
    for (const child of block.children) {
      if (child.classList.contains("prompt")) continue;
      output.append(child.cloneNode(true));
    }
  }

  function showHelp() {
    const out = el("div", "out");
    out.append(el("p", "muted", "Available commands (type or click):"));
    const list = el("ul", "help");
    for (const [cmd, desc] of HELP) {
      const li = el("li");
      li.append(cmdLink(cmd), el("span", "muted", desc));
      list.append(li);
    }
    out.append(list);
    output.append(out);
  }

  // Flipbook wave: swap whole frames, then rest upright for a moment.
  const WAVE = [HAND_UP, HAND_RIGHT, HAND_UP, HAND_LEFT, HAND_UP, HAND_RIGHT, HAND_UP, HAND_LEFT];
  const PAUSE = 8;

  function animateHand(pre) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let step = 0;
    const timer = setInterval(() => {
      if (!pre.isConnected) return clearInterval(timer);
      const i = step % (WAVE.length + PAUSE);
      pre.textContent = i < WAVE.length ? WAVE[i] : HAND_UP;
      step++;
    }, 180);
  }

  function showBanner() {
    const banner = el("div", "banner");
    const hand = el("pre", "hand", HAND_UP);
    hand.setAttribute("aria-hidden", "true");
    banner.append(hand);
    animateHand(hand);

    const intro = el("div", "intro");
    intro.append(el("h1", "greet", "Welcome"));
    intro.append(el("p", "muted", "Type a command, or click one:"));

    const cmds = el("p", "cmds");
    ["whoami", "experience", "skills", "contact"].forEach((c) => cmds.append(cmdLink(c)));
    intro.append(cmds);

    const tips = el("p", "muted");
    tips.append(cmdLink("help"), " lists everything \u00b7 Tab completes \u00b7 \u2191\u2193 history");
    intro.append(tips);

    banner.append(intro);
    output.append(banner);
  }

  // Each command clears the screen first, so only its own output is shown.
  function run(raw) {
    const cmd = raw.trim().replace(/\s+/g, " ");
    const key = cmd.toLowerCase();
    if (!cmd) return;
    history.push(cmd);
    histPos = history.length;

    output.replaceChildren();
    if (key === "clear" || key === "cls") {
      done();
      return;
    }

    promptLine(cmd);

    if (["hello", "hi", "hey", "wave", "welcome", "banner"].includes(key)) {
      showBanner();
    } else if (BLOCKS[key]) {
      showBlock(BLOCKS[key]);
    } else if (key === "help" || key === "?") {
      showHelp();
    } else if (key === "ls" || key === "ls ~" || key === "ls -la" || key === "ls -l") {
      print(FILES.join("   "));
    } else if (key === "history") {
      print(history.map((h, i) => String(i + 1).padStart(3) + "  " + h).join("\n"), "pre");
    } else if (key === "pwd") {
      print("/home/sabiq");
    } else if (key === "date") {
      print(new Date().toString());
    } else if (key.startsWith("echo")) {
      print(cmd.slice(5));
    } else if (key.startsWith("sudo")) {
      print("sabiq is not in the sudoers file. This incident will be reported.", "warn");
    } else if (key === "exit" || key === "logout") {
      print("There's no escape. Try 'help' instead.");
    } else if (key.startsWith("cat ") || key.startsWith("ls ") || key.startsWith("cd")) {
      const name = cmd.split(" ")[0];
      const arg = cmd.slice(name.length + 1) || "~";
      print(name + ": " + arg + ": No such file or directory", "warn");
    } else {
      const out = print("command not found: " + cmd.split(" ")[0] + ". Type ", "warn");
      out.firstChild.append(cmdLink("help"), " to see what's available.");
    }
    done();
  }

  function done() {
    input.value = "";
    fitInput();
    window.scrollTo(0, 0);
  }

  function complete() {
    const v = input.value.toLowerCase();
    if (!v) return;
    const matches = COMPLETIONS.filter((c) => c.startsWith(v));
    if (matches.length === 1) {
      input.value = matches[0];
      fitInput();
    } else if (matches.length > 1) {
      output.replaceChildren();
      promptLine(input.value);
      print(matches.join("   "));
    }
  }

  // Size the input to its text so the block cursor sits right after it.
  function fitInput() {
    input.style.width = input.value.length + "ch";
  }
  input.addEventListener("input", fitInput);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    run(input.value);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "ArrowUp") {
      if (histPos > 0) input.value = history[--histPos];
      fitInput();
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      histPos = Math.min(histPos + 1, history.length);
      input.value = history[histPos] || "";
      fitInput();
      e.preventDefault();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      run("clear");
    }
  });

  // Click anywhere on the terminal to type, unless selecting text or clicking a link.
  screen.addEventListener("click", (e) => {
    if (e.target.closest("a, button, input")) return;
    if (String(window.getSelection())) return;
    input.focus({ preventScroll: true });
  });

  // Start the session like a fresh login.
  showBanner();
})();
