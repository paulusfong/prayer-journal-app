/* c8 ignore file */
export type Dictionary = {
  appName: string;
  nav: {
    open: string;
    answered: string;
    newRequest: string;
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
    visibilityPrivate: string;
    submitNew: string;
    submitEdit: string;
  };
  request: {
    private: string;
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
    visibilityPrivate: "Only me",
    submitNew: "Log request",
    submitEdit: "Save",
  },
  request: {
    private: "Private",
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
  privacy: {
    title: "Privacy",
    p1: "Prayer Journal stores your email address, the name you choose, and the prayer requests, updates, and notes you write.",
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
