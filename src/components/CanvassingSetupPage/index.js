
import React, { PureComponent } from 'react';

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import sha1 from 'sha1';
import Modal from 'react-native-simple-modal';
import storage from 'react-native-storage-wrapper';
import Swipeout from 'react-native-swipeout';
import Icon from 'react-native-vector-icons/FontAwesome';
import DropboxLoginPage from '../DropboxLoginPage';
import { Dropbox } from 'dropbox';
import { _loginPing, _saveUser } from '../../common';

export default class App extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      user: null,
      forms: [],
      dbx: null,
      connected: false,
      DropboxLoginScreen: false,
      JoinFormScreen: false,
    };

  }

  componentDidMount() {
    this._loadDBData();
  }

  _loadDBData = async () => {
    const { navigate } = this.props.navigation;
    let folders = [];
    let forms_local = [];

    this.setState({loading: true});

    try {
      forms_local = JSON.parse(await storage.get('OV_CANVASS_FORMS'));
    } catch (e) {
      console.warn(e);
      return;
    }

    let user;
    let dbx;
    let forms = [];

    // look for canvassing forms
    try {
      user = await _loginPing(this, false);
      dbx = new Dropbox({ accessToken: user.dropbox.accessToken });
      let res = await dbx.filesListFolder({path: ''});
      for (let i in res.entries) {
        item = res.entries[i];
        if (item['.tag'] != 'folder') continue;
        folders.push(item.path_display);
      }
      this.setState({connected: true});
    } catch (e) {
    }

    let pro = [];

    for (let i in folders) {
      pro.push(dbx.filesDownload({ path: folders[i]+'/canvassingform.json' }));
    }

    let objs = await Promise.all(pro.map(p => p.catch(e => e)));
    for (let i in objs) {
      try {
        item = objs[i];
        if (item.error) continue;
        let json = JSON.parse(item.fileBlob);
        json.backend = "dropbox";
        json.folder_path = item.path_display.match('.*/')[0].slice(0, -1);

        for (let idx in forms_local) {
          if (forms_local[idx] === null || forms_local[idx].id === json.id) delete forms_local[idx];
        }

        forms_local.push(json);
      } catch(e) {
        console.warn(e);
      }
    }

    if (!user.dropbox && forms_local === null) {
      // gendate a sample form for them
      let id = sha1(new Date().getTime());
      forms_local = [{
        "id": id,
        "created": Math.floor(new Date().getTime() / 1000),
        "name": "Sample Canvassing Form",
        "author": "Our Voice USA",
        "author_id": id,
        "version": 1,
        "questions":{
          "FullName":{"type":"String","label":"Full Name","optional":true},
          "Email":{"type":"String","label":"Email Address","optional":true},
          "Puppy breed preferences":{"type":"SAND","label":"I prefer my puppies to be fuzzy and cute.","optional":true},
          "Puppy preferences":{"type":"Boolean","label":"Turn this switch ON if you prefer puppies stay outside.","optional":true},
          "Bad Puppy preferences":{"type":"SAND","label":"When puppies misbehave, I often shrug it off because hey, they're cute puppies.","optional":true},
          "Puppy breeds":{"type":"TEXTBOX","label":"Please list as many breeds of puppies you would like to have for your very own.","optional":true},
          "Puppy breed specify":{"type":"String","label":"Of the breeds you've listed, which style of puppy is your favorite? (There can be only one)","optional":true},
          "Number of puppies":{"type":"Number","label":"How many puppies can you hold in your arms without dropping any?","optional":true},
          "Puppy puddles":{"type":"Boolean","label":"Turn this switch ON if you dont mind mopping up puppy puddles.","optional":true},
          "Puppy trees":{"type":"String","label":"If your favorite breed of puppy could be any type of tree, what type of tree would your favorite fuzzy little puddle-making puppy choose?","optional":true},
        },
        "questions_order":["FullName","Email","Puppy breed preferences","Puppy preferences","Bad Puppy preferences","Puppy breeds","Puppy breed specify","Number of puppies","Puppy puddles","Puppy trees"],
      }];
    }

    for (let i in forms_local) {
      let json = forms_local[i];
      if (json === null) continue;

      let icon = "mobile";
      let color = "black";
      let size = 30;

      if (json.backend === "dropbox") {
        icon = "dropbox";
        color = "#3d9ae8";
        size = 25;
      }

      let swipeoutBtns = [
        {
          text: 'Edit',
          type: 'primary',
          onPress: () => {
            if (json.backend === "dropbox" && !user.dropbox) {
              this.setState({DropboxLoginScreen: true});
              return;
            }
            navigate('CreateSurvey', {refer: this, form: json});
          },
        },
        {
          text: 'Delete',
          type: 'delete',
          onPress: () => {
            Alert.alert(
              'Delete Form',
              'Are you sure you wish to delete this form? All related canvassing data will be lost.',
              [
                {text: 'Yes', onPress: async () => {
                  try {
                    if (json.backend === "dropbox") {
                      await dbx.filesDeleteV2({path: json.folder_path});
                    }
                    delete forms_local[i];
                    await storage.del('OV_CANVASS_PINS@'+json.id);
                    await storage.set('OV_CANVASS_FORMS', JSON.stringify(forms_local));
                    Alert.alert(
                      'Delete Success',
                      'You have deleted the form: '+json.name,
                      [{text: 'OK'}],
                      { cancelable: false }
                    );
                    this._loadDBData();
                  } catch (e) {
                    Alert.alert(
                      'Delete Failed',
                      'There was an error deleting the form: '+json.name,
                      [{text: 'OK'}],
                      { cancelable: false }
                    );
                    console.warn(e);
                  }
                }},
                {text: 'No'},
              ], { cancelable: false }
            );
          },
        },
      ];

      if (user.dropbox && json.backend === "dropbox")
        if (this.state.connected !== true || user.dropbox.account_id !== json.author_id)
          swipeoutBtns.shift();

      forms.push(
        <View key={i} style={{margin: 5, flexDirection: 'row'}}>
          <Swipeout
            style={{backgroundColor: '#d7d7d7', flex: 1, padding: 10, borderRadius: 20, maxWidth: 350}}
            right={swipeoutBtns}
            autoClose={true}>
            <TouchableOpacity
              onPress={() => {
                if (json.backend === "dropbox" && !user.dropbox)
                  this.setState({DropboxLoginScreen: true});
                else
                  navigate('Canvassing', {dbx: (json.backend === "dropbox" ? dbx : null), form: json, user: user});
              }}>
              <View style={{flexDirection: 'row'}}>
                <Icon style={{margin: 5, marginRight: 10}} name={icon} size={size} color={color} />
                <View>
                  <Text style={{fontWeight: 'bold'}}>{json.name}</Text>
                  <Text style={{fontSize: 12}}>Created by {json.author}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Swipeout>
        </View>
      );
    }

    // cache forms locally
    try {
      await storage.set('OV_CANVASS_FORMS', JSON.stringify(forms_local));
    } catch (error) {
    }

    this.setState({ loading: false, forms: forms, dbx: dbx });
  }

  _canvassGuidelinesUrlHandler() {
    const url = "https://github.com/OurVoiceUSA/OVMobile/blob/master/docs/Canvassing-Guidelines.md";
    return Linking.openURL(url).catch(() => null);
  }

  _canvassUrlHandler() {
    const url = "https://github.com/OurVoiceUSA/OVMobile/blob/master/docs/Canvassing.md";
    return Linking.openURL(url).catch(() => null);
  }

  dropboxLogout() {
    let { user } = this.state;
    if (user.dropbox)
      new Dropbox({ accessToken: user.dropbox.accessToken }).authTokenRevoke();
    delete user.dropbox;
    _saveUser(user, false);
    this.props.navigation.goBack();
  }

  render() {
    const { loading, connected, user, forms } = this.state;
    const { navigate } = this.props.navigation;

    // wait for user object to become available
    if (!user) return (
        <View style={{flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{fontSize: 20}}>Loading user data...</Text>
          <ActivityIndicator />
        </View>
      );

    if (!loading && !forms.length) {
      forms.push(
        <View key={1}>
          <Text>No Canvassing forms. Ask someone who created one to share their form with you, or create a new one.</Text>
        </View>
      );
    }

    return (
      <ScrollView style={{flex: 1, backgroundColor: 'white'}} contentContainerStyle={{flexGrow:1}}>

        {user.dropbox &&
        <View style={{margin: 20, alignItems: 'center'}}>
          <Text>You are logged into Dropbox as:</Text>
          <Text>{user.dropbox.name.display_name}</Text>
        </View>
        ||
        <View style={{flexDirection: 'row', margin: 20}}>
          <Text>
            Canvass for any cause at zero cost! Use this tool to organize a canvassing campaign, or join an existing one.
          </Text>
        </View>
        }

        <View style={{
            width: Dimensions.get('window').width,
            height: 1,
            backgroundColor: 'lightgray'
          }}
        />

        <View style={{flexDirection: 'row', margin: 20, marginTop: 0}}>
            {loading &&
            <View style={{flex: 1, margin: 20, alignItems: 'center'}}>
               <Text>Loading data from Dropbox...</Text>
              <ActivityIndicator size="large" />
            </View>
            ||
            <View style={{flex: 1, alignItems: 'center'}}>
              {!connected &&
              <Text style={{margin: 10, color: '#ff0000'}}>Not connected to Dropbox.</Text>
              }
              <Text style={{margin: 10}}>Select a canvassing campaign:</Text>
              { forms }
            </View>
            }
        </View>

        <View>
          <View style={{width: Dimensions.get('window').width, height: 1, backgroundColor: 'lightgray'}} />

          <View style={{margin: 12, alignItems: 'center'}}>
            <Icon.Button
              name="plus-circle"
              backgroundColor="#d7d7d7"
              color="black"
              onPress={() => {
                if (user.dropbox)
                  navigate('CreateSurvey', {refer: this, form: null})
                else {
                  Alert.alert(
                    'Choose Data Storage',
                    'You can save your canvassing data on your device, or on a dropbox acccount. With Dropbox, you can share your form with others and collaborate as a team.',
                    [
                      {text: 'Use Device Storage', onPress: () => navigate('CreateSurvey', {refer: this, form: null})},
                      {text: 'Use Dropbox', onPress: () => this.setState({DropboxLoginScreen: true})},
                    ], { cancelable: false }
                  );
                }
              }}>
              Create Canvassing Form
            </Icon.Button>
          </View>

          <View style={{margin: 12, marginTop: 0, alignItems: 'center'}}>
            <Icon.Button
              name="check-square"
              backgroundColor="#d7d7d7"
              color="black"
              onPress={() => {
                if (user.dropbox)
                  this.setState({JoinFormScreen: true});
                else
                  this.setState({DropboxLoginScreen: true});
              }}>
              Join an existing Form
            </Icon.Button>
          </View>

          {user.dropbox &&
          <View style={{margin: 12, marginTop: 0, alignItems: 'center'}}>
            <Icon.Button
              name="dropbox"
              backgroundColor="#3d9ae8"
              color="#ffffff"
              onPress={() => {
                Alert.alert(
                  'Dropbox Logout',
                  'Are you sure you wish to logout of Dropbox?',
                  [
                    {text: 'Yes', onPress: () => this.dropboxLogout()},
                    {text: 'No'},
                  ], { cancelable: false }
                );
              }}>
              Dropbox Logout
            </Icon.Button>
          </View>
          ||
          <View style={{margin: 12, marginTop: 0, alignItems: 'center'}}>
            <Icon.Button
              name="dropbox"
              backgroundColor="#3d9ae8"
              color="#ffffff"
              onPress={() => this.setState({DropboxLoginScreen: true})}>
              Login with Dropbox
            </Icon.Button>
          </View>
          }

        </View>

        <View style={{
            width: Dimensions.get('window').width,
            height: 1,
            backgroundColor: 'lightgray'
          }}
        />

        <View style={{margin: 12}}>
          <Text>
            Need help using this tool? Check out our <Text style={{fontWeight: 'bold', color: 'blue'}} onPress={() => {this._canvassUrlHandler()}}>
            canvassing documentation</Text> with useful articles and video demos.
          </Text>
        </View>

        <View style={{
            width: Dimensions.get('window').width,
            height: 1,
            backgroundColor: 'lightgray'
          }}
        />

        <View style={{margin: 12}}>
          <Text>
            By using this tool you acknowledge that you are acting on your own behalf, do not represent Our Voice USA
            or its affiliates, and have read our <Text style={{fontWeight: 'bold', color: 'blue'}} onPress={() => {this._canvassGuidelinesUrlHandler()}}>
            canvassing guidelines</Text>. Please be courteous to those you meet.
          </Text>
        </View>

        <Modal
          open={this.state.DropboxLoginScreen}
          modalStyle={{width: 335, height: 400, backgroundColor: "transparent"}}
          style={{alignItems: 'center'}}
          overlayBackground={'rgba(0, 0, 0, 0.75)'}
          animationDuration={200}
          animationTension={40}
          modalDidOpen={() => undefined}
          modalDidClose={() => this.setState({DropboxLoginScreen: false})}
          closeOnTouchOutside={true}
          disableOnBackPress={false}>
          <DropboxLoginPage refer={this} />
        </Modal>

        <Modal
          open={this.state.JoinFormScreen}
          modalStyle={{width: 335, height: 400, backgroundColor: "transparent"}}
          style={{alignItems: 'center'}}
          overlayBackground={'rgba(0, 0, 0, 0.75)'}
          animationDuration={200}
          animationTension={40}
          modalDidOpen={() => undefined}
          modalDidClose={() => this.setState({JoinFormScreen: false})}
          closeOnTouchOutside={true}
          disableOnBackPress={false}>
          <View style={{flex: 1, alignItems: 'center'}} ref="backgroundWrapper">
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: 335}}>
              <View style={{backgroundColor: 'white', padding: 40, borderRadius: 40, borderWidth: 10, borderColor: '#d7d7d7'}}>
                <View style={{margin: 10}}>
                  <Text style={{textAlign: 'justify'}}>
                    To join an existing form, ask the creator of that form to
                    shair it with you. They can do so by pressing the
                    "Share Form" button in the canvassing settings and entering
                    the email address you use for Dropbox. Then, accept the folder
                    share with Dropbox and reload this app.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    );
  }

}

const iconStyles = {
  justifyContent: 'center',
  borderRadius: 10,
  padding: 10,
};
