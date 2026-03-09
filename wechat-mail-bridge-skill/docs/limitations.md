# Limitations

- WeChat desktop UI automation can break after client UI updates.
- Reliability depends on active desktop session state.
- Desktop lock/minimized RDP scenarios can break GUI automation visibility and control.
- Missing accessibility permissions or privilege mismatch can block automation.
- BHMailer response normalization is heuristic when provider payload shape changes.
- Push-webhook to chat correlation is basic in current implementation; advanced watch correlation is a next milestone item.
- `pywinauto`/`uiautomation` inbound watch is implemented as generic polling and may produce false positives/duplicates across WeChat UI versions.
