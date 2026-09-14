/* c8 ignore file */
export type Dictionary = {
  appName: string;
  nav: {
    open: string;
    answered: string;
    newRequest: string;
    feedback: string;
    help: string;
    circle: string;
    signOut: string;
    privacy: string;
    language: string;
  };
  localeNames: {
    en: string;
    "zh-Hans": string;
    "zh-Hant": string;
    es: string;
  };
  categories: {
    health: string;
    family: string;
    work_school: string;
    church_ministry: string;
    friends: string;
    other: string;
  };
  home: {
    title: string;
    logRequest: string;
    logRequestTitle: string;
    empty: string;
    private: string;
    shared: string;
    edit: string;
  };
  answered: {
    title: string;
    empty: string;
    answeredOn: string;
  };
  requestForm: {
    newTitle: string;
    editTitle: string;
    title: string;
    body: string;
    category: string;
    categoryNone: string;
    categoryOther: string;
    visibilityLegend: string;
    visibilityCircle: string;
    visibilityPeople: string;
    visibilityPrivate: string;
    submitNew: string;
    submitEdit: string;
  };
  request: {
    private: string;
    shared: string;
    answered: string;
    personPrayed: string;
    peoplePrayed: string;
    iPrayed: string;
    iPrayedUndo: string;
    markAnswered: string;
    reopen: string;
    edit: string;
    delete: string;
    updates: string;
    noUpdates: string;
    remove: string;
    addUpdateLabel: string;
    addUpdate: string;
    notes: string;
    noNotes: string;
    addNoteLabel: string;
    addNote: string;
  };
  signIn: {
    title: string;
    lede: string;
    sent: string;
    email: string;
    sendLink: string;
    confirmTitle: string;
    confirmLede: string;
    confirmButton: string;
  };
  circle: {
    title: string;
    invite: string;
    copyOnce: string;
    activeUntil: string;
    noInvite: string;
    resetInvite: string;
    waiting: string;
    waitingCount: string;
    noWaiting: string;
    approve: string;
    decline: string;
    members: string;
    ownerRole: string;
    remove: string;
  };
  profile: {
    title: string;
    lede: string;
    displayName: string;
    save: string;
  };
  feedback: {
    title: string;
    lede: string;
    thanks: string;
    kindLegend: string;
    kindComment: string;
    kindFeature: string;
    kindCommentShort: string;
    kindFeatureShort: string;
    bodyLabel: string;
    submit: string;
    received: string;
    empty: string;
  };
  help: {
    title: string;
    intro: string;
    joinTitle: string;
    joinBody: string;
    signInTitle: string;
    signInBody: string;
    requestsTitle: string;
    requestsBody: string;
    prayTitle: string;
    prayBody: string;
    answeredTitle: string;
    answeredBody: string;
    circleTitle: string;
    circleBody: string;
    languageTitle: string;
    languageBody: string;
    feedbackTitle: string;
    feedbackBody: string;
  };
  privacy: {
    title: string;
    p1: string;
    p2: string;
    p3: string;
  };
  needInvite: {
    title: string;
    lede: string;
  };
  pending: {
    title: string;
    lede: string;
  };
  expired: {
    title: string;
    lede: string;
  };
};

export const en: Dictionary = {
  appName: "Prayer Journal",
  nav: {
    open: "Open",
    answered: "Answered",
    newRequest: "New request",
    feedback: "Feedback",
    help: "Help",
    circle: "Circle",
    signOut: "Sign out",
    privacy: "Privacy",
    language: "Language",
  },
  localeNames: {
    en: "English",
    "zh-Hans": "简体中文",
    "zh-Hant": "繁體中文",
    es: "Español",
  },
  categories: {
    health: "Health",
    family: "Family",
    work_school: "Work/School",
    church_ministry: "Church/Ministry",
    friends: "Friends",
    other: "Other",
  },
  home: {
    title: "Open requests",
    logRequest: "Log a request",
    logRequestTitle: "Click to log a new prayer request",
    empty: "No open requests — add one.",
    private: "Private",
    shared: "Shared",
    edit: "Edit",
  },
  answered: {
    title: "Answered",
    empty: "Nothing marked answered yet.",
    answeredOn: "answered {date}",
  },
  requestForm: {
    newTitle: "Log a request",
    editTitle: "Edit request",
    title: "Title",
    body: "The ask (optional)",
    category: "Category (optional)",
    categoryNone: "None",
    categoryOther: "If other, say what",
    visibilityLegend: "Who can see this",
    visibilityCircle: "Whole circle",
    visibilityPeople: "Pick people",
    visibilityPrivate: "Only me",
    submitNew: "Log request",
    submitEdit: "Save",
  },
  request: {
    private: "Private",
    shared: "Shared",
    answered: "Answered",
    personPrayed: "{count} person prayed",
    peoplePrayed: "{count} people prayed",
    iPrayed: "I prayed",
    iPrayedUndo: "I prayed — undo",
    markAnswered: "Mark answered",
    reopen: "Reopen",
    edit: "Edit",
    delete: "Delete",
    updates: "Updates",
    noUpdates: "No updates yet.",
    remove: "Remove",
    addUpdateLabel: "Add an update",
    addUpdate: "Add update",
    notes: "Notes",
    noNotes: "No notes yet.",
    addNoteLabel: "Leave a short note",
    addNote: "Add note",
  },
  signIn: {
    title: "Sign in",
    lede: "We’ll email you a link. No password.",
    sent: "Check your email for a sign-in link.",
    email: "Email",
    sendLink: "Send link",
    confirmTitle: "Finish signing in",
    confirmLede: "Click below to enter the journal. This keeps email scanners from using the link for you.",
    confirmButton: "Sign in",
  },
  circle: {
    title: "Circle",
    invite: "Invite",
    copyOnce:
      "Copy this link now — the raw token is shown only right after you reset it, not stored in the database.",
    activeUntil:
      "An invite link is active until {date}. Reset the link to reveal a new join URL (shown once). Anyone with the link still needs your approval.",
    noInvite: "No active invite link.",
    resetInvite: "Reset invite link",
    waiting: "Waiting",
    waitingCount: "Waiting ({count})",
    noWaiting: "No one waiting.",
    approve: "Approve",
    decline: "Decline",
    members: "Members",
    ownerRole: "owner",
    remove: "Remove",
  },
  profile: {
    title: "What should we call you?",
    lede: "Shown next to “I prayed” and notes. Email stays private.",
    displayName: "Display name",
    save: "Save",
  },
  feedback: {
    title: "About this app",
    lede: "A feature idea or a short comment. The circle owner can read it.",
    thanks: "Thanks — it was saved.",
    kindLegend: "What is this",
    kindComment: "Comment",
    kindFeature: "Feature request",
    kindCommentShort: "Comment",
    kindFeatureShort: "Feature",
    bodyLabel: "Your note",
    submit: "Send",
    received: "Received",
    empty: "Nothing yet.",
  },
  help: {
    title: "How to use Prayer Journal",
    intro: "This journal is for one small circle. Here is the short path from invite to praying together.",
    joinTitle: "Join the circle",
    joinBody: "You need an invite link from the circle owner. Open the link, request a magic sign-in email, then wait for the owner to approve you. Until then you will see a waiting screen.",
    signInTitle: "Sign in",
    signInBody: "There is no password. Enter your email, open the link we send, and confirm Sign in on that page (so email scanners do not use the link for you).",
    requestsTitle: "Log a prayer request",
    requestsBody: "Use New request. Add a title and optional details, pick a category if you want, and choose Whole circle, Pick people, or Only me. The date is the day you log it. You can edit your own requests later from Open or the request page.",
    prayTitle: "Pray, notes, and updates",
    prayBody: "Open a request to mark I prayed, leave a short note, or (if you are the author) add an update. Anyone in the circle who can see the request may mark it answered; the author can reopen it.",
    answeredTitle: "Answered list",
    answeredBody: "Answered moves finished requests out of Open so the circle can keep praying for what is still current. Open an answered item anytime to read it or reopen.",
    circleTitle: "Invites (owners)",
    circleBody: "Owners use Circle to reset the invite link (copy it when it appears — the raw token is shown once), approve or decline people waiting, and remove members if needed.",
    languageTitle: "Language",
    languageBody: "Use the language menu in the header. The labels switch as soon as you pick English, 简体中文, 繁體中文, or Español. Your prayer text stays exactly as you wrote it.",
    feedbackTitle: "Feedback",
    feedbackBody: "Use Feedback to send a comment or feature idea about the app (not a prayer). The circle owner can read what was sent.",
  },
  privacy: {
    title: "Privacy",
    p1: "Prayer Journal stores your email address, the name you choose, the prayer requests, updates, and notes you write, and any app comments or feature ideas you send.",
    p2: "We do not sell this. We do not use analytics that phone home. Mail we send uses the request title and a link — not the prayer body.",
    p3: "Ask the circle owner, or whoever runs this instance, to delete your account if you want out.",
  },
  needInvite: {
    title: "Ask the owner for an invite",
    lede: "This journal is a closed circle. You need an invite link to join.",
  },
  pending: {
    title: "Waiting for approval",
    lede: "The circle owner has your request. You’ll see the journal once they approve you.",
  },
  expired: {
    title: "This invite is no longer valid",
    lede: "Ask the owner for a new link.",
  },
};
