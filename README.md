## Introduction

This is the mobile app for Our Voice Initiative, a 501(c)(4) non-profit, non-partisian organization for the civic education. We are writing tools to engage everyday citizens with the political process by providing easy access to civic information that's relevant to the individual, and tools to take action.

Find the app on the [Google Play Store (Android)](https://play.google.com/store/apps/details?id=org.ourvoiceinitiative.ourvoice) and the [Apple Store (iPhone)](https://itunes.apple.com/us/app/our-voice-usa/id1275301651?ls=1&mt=8).

## Features

Our Voice is a mobile app for civic education and engagement. You can:
* View information on the politicians in office who represent you, contact them, and rate them.
* Canvass for any cause at zero cost.

## Future Development Goals

* Move the "Your Representatives" functionality from Native to React.js and call the web version.
* Further expand the Canvassing tool feature set:
  * signature gathering
  * turf management
  * scale to support national canvassing operations

## Development Setup

Start by settings up the back-end service - see the `civic-broker` git repository.

Set up your `.env` file:

    cat << EOF > .env
    WS_BASE=YOUR_CIVIC_BROKER_URL
    GOOGLE_API_KEY_IOS=YOUR_KEY
    GOOGLE_API_KEY_ANDROID=YOUR_KEY
    EOF

* The `GOOGLE_API_KEY_` values are credentials created by visiting http://console.developers.google.com/. If you plan on releasing this app, or a fork of it yourself, be sure you lock down the API key to the assosiated platform device specified to avoid quota theft.
* Without these keys, address searches and geocoding won't function, which limits functionality

Install https://nodejs.org/en/download/ if you havne't already, and run:

    npm install
    npm install -g react-native-cli

The install may overwrite some dependancy overrides or other configuration - revert those by doing a force checkout:

`git checkout -f`

If you're developing the **Android** app - install https://developer.android.com/studio/releases/ if you haven't already, import the `OVMobile/android` project, and follow the prompts to download all the build and runtime dependancies. You'll also have to run this command:

`echo "sdk.dir = $HOME/Library/Android/sdk" > android/local.properties`

If you're developing the **iOS** app - simply install the build dependancies with pods:

`(cd ios/ && pod install)`

Finally, build the app:

`react-native run-ios` or `react-native run-android`

**NOTE:** At the time of this writing, the tool versions are as follows:

    $ npm -v
    5.6.0
    $ node -v
    v8.11.1
    $ react-native -v
    react-native-cli: 2.0.1
    react-native: 0.55.4

## Test Automation

For testing we use `mocha` and `detox` on `ios`. Run the below to get setup with that:

    npm install -g detox-cli mocha-cli
    brew tap wix/brew
    brew install wix/brew/applesimutils
    brew tap facebook/fb
    brew install fbsimctl --HEAD
    detox build -c ios.sim.debug

Execute tests with:

    detox test -c ios.sim.debug

Test Automation for Android is waiting on them to support a newer version of react native, see https://github.com/wix/detox/issues/608

## Contributing

Thank you for your interest in contributing to us! To avoid potential legal headaches and to allow distribution on Apple's App Store please sign our CLA (Contributors License Agreement). We handle this via pull request hooks on GitHub provided by https://cla-assistant.io/

## License

	Software License Agreement (GPLv3+)
	
	Copyright (c) 2018, Our Voice Initiative. All rights reserved.
	
	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	
	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.
	
	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.

**NOTE:** We relicense this code for the purposes of distribution on the App Store. For details, read our CLA Rationale. 

