const FEED_POST_SIZES = new Set(["feature", "wide", "tall", "square"]);
const FEED_EMBED_TYPES = new Set(["linkedin", "tweet", "image", "none"]);

// New posts are inserted at index 0 so the feed always renders newest-first.
// New post template:
// { id, title, blurb?, blurbHtml?, story?, sourceUrl?, sourceLabel?, embedType, embedPayload, size }
const feedPosts = [
  {
    id: "yogurt",
    title: "yogurt",
    blurbHtml:
      "I built a small mac app called yogurt.<br><br>It can do anything openclaw does but with the granola MCP, it helps you do tasks you talk about in your meetings.<br><br>It's quite fun! I mainly built it to play around with granola MCP, openclaw and codex to see what might be possible.",
    story: "",
    sourceUrl: "https://twitter.com/bebackinamo/status/2028478774220632530",
    embedType: "tweet",
    embedPayload: {
      tweetUrl: "https://twitter.com/bebackinamo/status/2028478774220632530"
    },
    size: "wide"
  },
  {
    id: "mr-granola",
    title: "Mr. Granola",
    blurb:
      "on my last day, my ex-boss wrote \"Mr. Granola\" on my leaving card. That was the reputation I had built at work: the person who would not shut up about Granola. (they all knew that secretly I wanted to work there)",
    story:
      "later i had to clarify that i was not actually leaving to join Granola, but the nickname was real - and so was the enthusiasm.",
    sourceUrl:
      "https://www.linkedin.com/feed/update/urn:li:share:7344463395905032192/",
    embedType: "linkedin",
    embedPayload: {
      src: "https://www.linkedin.com/embed/feed/update/urn:li:share:7344463395905032192?collapsed=1",
      title: "LinkedIn post about being called Mr. Granola"
    },
    size: "feature"
  },
  {
    id: "festival-video",
    title: "Download Granola Sign",
    blurbHtml:
      'I spent a day outside Excel London (there was a conference going on called: <a href="https://www.festivalofwork.com/" target="_blank" rel="noopener noreferrer">festival of work</a>) with a <strong>download granola / notes or it didn\'t happen sign</strong>, talking to people about Granola and meeting users in person.',
    story: "",
    sourceUrl: "https://twitter.com/bebackinamo/status/1933088723052195943",
    embedType: "tweet",
    embedPayload: {
      tweetUrl: "https://twitter.com/bebackinamo/status/1933088723052195943"
    },
    size: "wide"
  },
  {
    id: "the-sign",
    title: "a video from that download granola sign day",
    blurb:
      "A fellow granola user came up to me and said he uses it everyday.",
    story: "",
    sourceUrl: "https://twitter.com/bebackinamo/status/1933222684688519242",
    embedType: "tweet",
    embedPayload: {
      tweetUrl: "https://twitter.com/bebackinamo/status/1933222684688519242"
    },
    size: "square"
  },
  {
    id: "ios-testing-gift",
    title: "my favourite delivery ever",
    blurb:
      "After helping with iOS testing, the team sent a thoughtful package. It genuinely made my month.",
    story:
      "It was one of those rare moments where a product team makes you feel seen as a user, not just a metric.",
    sourceUrl: "https://twitter.com/bebackinamo/status/1991201486915637641",
    embedType: "tweet",
    embedPayload: {
      tweetUrl: "https://twitter.com/bebackinamo/status/1991201486915637641"
    },
    size: "tall"
  },
  {
    id: "open-thread",
    title: "@sam i hope i'm still on your radar...",
    blurb: "",
    story: "",
    sourceUrl: "",
    embedType: "image",
    embedPayload: {
      src: "/assets/sam-radar-thread.png",
      alt: "Email thread screenshot with Chris and Sam"
    },
    size: "wide"
  }
];

const template = document.querySelector("#artifact-card-template");
const artifactGrid = document.querySelector("#artifact-grid");

let masonryRaf = 0;
let masonryObserver = null;

renderFeed(getFeedPosts());
initializeMasonry();

function getFeedPosts() {
  return [...feedPosts];
}

function prependFeedPost(post) {
  const validatedPost = validateFeedPost(post);
  feedPosts.unshift(validatedPost);
  renderFeed(getFeedPosts());
  return validatedPost;
}

function renderFeed(posts) {
  if (!Array.isArray(posts)) {
    return;
  }

  artifactGrid.innerHTML = "";
  posts.forEach((post) => {
    const clone = template.content.cloneNode(true);

    const card = clone.querySelector(".artifact-card");
    const title = clone.querySelector(".artifact-title");
    const blurb = clone.querySelector(".artifact-blurb");
    const story = clone.querySelector(".artifact-story");
    const sourceLink = clone.querySelector(".artifact-link");
    const embedContainer = clone.querySelector("[data-embed-container]");
    const embedNote = clone.querySelector(".embed-note");

    card.classList.add(`size-${post.size}`);
    card.id = `artifact-${post.id}`;
    title.textContent = post.title;

    if (post.blurbHtml) {
      blurb.innerHTML = post.blurbHtml;
    } else if (post.blurb) {
      blurb.textContent = post.blurb;
    } else {
      blurb.remove();
    }

    if (post.story) {
      story.textContent = post.story;
    } else {
      story.remove();
    }

    if (post.sourceUrl) {
      sourceLink.href = post.sourceUrl;
      sourceLink.textContent = post.sourceLabel || "View original post";
      sourceLink.setAttribute("aria-label", `${post.title} source post`);
    } else {
      sourceLink.remove();
    }

    if (post.embedType === "none") {
      embedContainer.remove();
      embedNote.remove();
    } else if (post.embedType === "image") {
      embedNote.remove();
    }

    artifactGrid.appendChild(clone);
    ensureEmbedLoaded(post, embedContainer);
  });

  observeCardsForMasonry();
  requestMasonryLayout();
}

function validateFeedPost(post) {
  if (!post || typeof post !== "object") {
    throw new Error("Feed post must be an object.");
  }

  ["id", "title", "embedType", "size"].forEach((fieldName) => {
    if (typeof post[fieldName] !== "string" || post[fieldName].trim() === "") {
      throw new Error(`Feed post is missing required field: ${fieldName}`);
    }
  });

  if (!FEED_EMBED_TYPES.has(post.embedType)) {
    throw new Error(`Unsupported embedType: ${post.embedType}`);
  }

  if (!FEED_POST_SIZES.has(post.size)) {
    throw new Error(`Unsupported size: ${post.size}`);
  }

  if (post.embedType !== "none" && (!post.embedPayload || typeof post.embedPayload !== "object")) {
    throw new Error("Feed post requires embedPayload when embedType is not 'none'.");
  }

  return { ...post };
}

function ensureEmbedLoaded(post, container) {
  if (!post || !container) {
    return;
  }

  if (post.embedType === "linkedin") {
    renderLinkedInEmbed(container, post.embedPayload);
    return;
  }

  if (post.embedType === "tweet") {
    renderTweetEmbed(container, post.embedPayload);
    return;
  }

  if (post.embedType === "image") {
    renderImageEmbed(container, post.embedPayload);
  }
}

function renderLinkedInEmbed(container, payload) {
  const shell = document.createElement("div");
  shell.className = "embed-shell linkedin-shell";

  const frame = document.createElement("iframe");
  frame.src = payload.src;
  frame.title = payload.title;
  frame.loading = "lazy";
  frame.allowFullscreen = true;
  frame.addEventListener("load", requestMasonryLayout);

  shell.appendChild(frame);
  container.appendChild(shell);
  requestMasonryLayout();
}

function renderTweetEmbed(container, payload) {
  const shell = document.createElement("div");
  shell.className = "embed-shell tweet-shell";
  const tweetId = extractTweetId(payload.tweetUrl);

  if (!tweetId) {
    const fallback = document.createElement("p");
    fallback.className = "embed-fallback";
    fallback.textContent = "Embed unavailable in this browser session.";
    shell.appendChild(fallback);
    container.appendChild(shell);
    return;
  }

  const frame = document.createElement("iframe");
  frame.src = `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=light&dnt=true`;
  frame.loading = "lazy";
  frame.referrerPolicy = "origin";
  frame.title = "Embedded X post";
  frame.addEventListener("load", requestMasonryLayout);

  shell.appendChild(frame);
  container.appendChild(shell);
  requestMasonryLayout();
}

function renderImageEmbed(container, payload) {
  const shell = document.createElement("div");
  shell.className = "embed-shell image-shell";

  const img = document.createElement("img");
  img.src = payload.src;
  img.alt = payload.alt || "artifact image";
  img.loading = "lazy";
  img.addEventListener("load", requestMasonryLayout);

  shell.appendChild(img);
  container.appendChild(shell);
  requestMasonryLayout();
}

function extractTweetId(tweetUrl) {
  if (!tweetUrl) {
    return null;
  }

  const match = tweetUrl.match(/status\/(\d+)/);
  if (!match) {
    return null;
  }

  return match[1];
}

function initializeMasonry() {
  window.addEventListener("resize", requestMasonryLayout, { passive: true });
  window.addEventListener("load", requestMasonryLayout);

  if ("ResizeObserver" in window) {
    masonryObserver = new ResizeObserver(() => requestMasonryLayout());
  }

  observeCardsForMasonry();
  requestMasonryLayout();
}

function observeCardsForMasonry() {
  if (!masonryObserver) {
    return;
  }

  masonryObserver.disconnect();
  artifactGrid.querySelectorAll(".artifact-card").forEach((card) => {
    masonryObserver.observe(card);
  });
}

function requestMasonryLayout() {
  if (masonryRaf) {
    window.cancelAnimationFrame(masonryRaf);
  }

  masonryRaf = window.requestAnimationFrame(() => {
    masonryRaf = 0;
    applyMasonryLayout();
  });
}

function applyMasonryLayout() {
  const gridStyles = window.getComputedStyle(artifactGrid);
  const autoRows = Number.parseFloat(gridStyles.getPropertyValue("grid-auto-rows"));
  const rowGap = Number.parseFloat(gridStyles.getPropertyValue("row-gap"));
  const cards = artifactGrid.querySelectorAll(".artifact-card");

  if (!autoRows || Number.isNaN(autoRows)) {
    cards.forEach((card) => {
      card.style.gridRowEnd = "";
    });
    return;
  }

  cards.forEach((card) => {
    card.style.gridRowEnd = "auto";
    const cardHeight = card.getBoundingClientRect().height;
    const span = Math.ceil((cardHeight + rowGap) / (autoRows + rowGap));
    card.style.gridRowEnd = `span ${Math.max(span, 1)}`;
  });
}

window.getFeedPosts = getFeedPosts;
window.prependFeedPost = prependFeedPost;
window.renderFeed = renderFeed;
