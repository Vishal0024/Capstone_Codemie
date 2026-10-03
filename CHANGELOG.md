# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Todo cards show the creation date as "Created DD Mon YYYY" in the user's local time zone (EPMCDMETST-67543)
- Todo cards show "Edited DD Mon YYYY" when a task was changed more than 1 second after creation, separated by " · " on desktop and stacked at 480px and below (EPMCDMETST-67543)
- Cards with a missing or invalid creation date show "Created: Not available" instead of an error (EPMCDMETST-67543)
- Playwright E2E test setup (`npm run test:e2e`, `playwright.config.js`) (EPMCDMETST-67543)

### Changed
- The card line "Created: … | Updated: …" is replaced by the new Created/Edited dates (EPMCDMETST-67543)
- Card date text colour changed from #bbb to #6b7280 for readable contrast (4.83:1 on white) (EPMCDMETST-67543)
