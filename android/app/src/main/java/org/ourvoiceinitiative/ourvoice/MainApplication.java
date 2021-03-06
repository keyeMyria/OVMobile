package org.ourvoiceinitiative.ourvoice;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.devfd.RNGeocoder.RNGeocoderPackage;
import com.airbnb.android.react.maps.MapsPackage;
import com.timhagn.rngloc.RNGLocation;
import com.lugg.ReactNativeConfig.ReactNativeConfigPackage;
import com.arttitude360.reactnative.rngoogleplaces.RNGooglePlacesPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.oblador.vectoricons.VectorIconsPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RNGeocoderPackage(),
            new MapsPackage(),
            new RNGLocation(),
            new ReactNativeConfigPackage(),
            new RNGooglePlacesPackage(),
            new RNDeviceInfo(),
            new VectorIconsPackage()
      );
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
