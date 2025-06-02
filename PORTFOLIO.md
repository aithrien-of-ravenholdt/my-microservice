devices: ({
  name: "Wireless Mouse MX Master 3";

  smartshift: {
    on: true;
    threshold: 15;
  };

  hiresscroll: {
    hires: true;
    invert: false;
    target: false;
  };

  dpi: 1500;

  buttons: (
    // Forward button: New tab
    {
      cid: 0x56;
      action = {
        type: "Keypress";
        keys: [ "KEY_LEFTCTRL", "KEY_T" ]; // Ctrl + T
      };
    },

    // Back button: Close tab
    {
      cid: 0x53;
      action = {
        type: "Keypress";
        keys: [ "KEY_LEFTCTRL", "KEY_W" ]; // Ctrl + W
      };
    },

    // Gesture button
    {
      cid: 0xc3;
      action = {
        type: "Gestures";
        gestures: (
          // Press: Show overview
          {
            direction: "None";
            mode: "OnRelease";
            action = {
              type: "Keypress";
              keys: [ "KEY_LEFTMETA" ]; // Show overview/activities
            };
          },

          // Left: Previous workspace
          {
            direction: "Left";
            mode: "OnRelease";
            action = {
              type: "Keypress";
              keys: [ "KEY_LEFTCTRL", "KEY_LEFTALT", "KEY_LEFT" ]; // Move to previous workspace
            };
          },

          // Right: Next workspace
          {
            direction: "Right";
            mode: "OnRelease";
            action = {
              type: "Keypress";
              keys: [ "KEY_LEFTCTRL", "KEY_LEFTALT", "KEY_RIGHT" ]; // Move to next workspace
            };
          }
        );
      };
    },

    // Top button: Toggle SmartShift only
    {
      cid: 0xc4;
      action = {
        type: "ToggleSmartShift";
      };
    }
  );

  // Horizontal scroll wheel: switch browser tabs
  hscroll: {
    target: false; // Disable default scroll behavior
    left = {
      type: "Keypress";
      keys: [ "KEY_LEFTCTRL", "KEY_LEFTSHIFT", "KEY_TAB" ]; // Ctrl+Shift+Tab (previous tab)
    };
    right = {
      type: "Keypress";
      keys: [ "KEY_LEFTCTRL", "KEY_TAB" ]; // Ctrl+Tab (next tab)
    };
  };
});

