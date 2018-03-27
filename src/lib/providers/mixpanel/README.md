<img 
    src="../../../assets/svg/mixpanel.svg" 
    alt="Mixpanel logo"
    height="100px"
    width="200px" />

# Mixpanel
__homepage__: [mixpanel.com](https://mixpanel.com/)  
__docs__: [mixpanel.com/help/reference/javascript](https://mixpanel.com/help/reference/javascript)  
__import__: `import { Angulartics2Mixpanel } from 'angulartics2/mixpanel';`  
__import async__: `import { Angulartics2MixpanelAsync } from 'angulartics2/mixpanel';`  

## Setup
1. Add tracking code [provided by Mixpanel](https://mixpanel.com/help/reference/javascript) to right above the header closing tag ``</header>``
2. [Setup Angulartics](https://github.com/angulartics/angulartics2/tree/next#installation) using `Angulartics2Mixpanel` or `Angulartics2MixpanelAsync`

## Integrating with NgRx:
You have a chance to unburden the integration process if your system is using NgRx. Specifically, we can reuse the existing actions in our application and use effects to catch and dispatch a mixpanel action accordingly.    
### Boilerplating:
```angular2html
/**
 * Action definition
 */
export const MIXPANEL_TRACK = '[MIXPANEL] Track';

export class MixpanelTrack implements Action {
  readonly type = MIXPANEL_TRACK;

  constructor(public payload: MixPanelPayload) {}
}

export interface MixPanelPayload {
  action: string;
  properties?: MixPanelPayloadProperties;
}

export interface MixPanelPayloadProperties {
  // Your custom properties go here
}
```
### Catch and dispatch a mixpanel event by an effect:
```angular2html
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Angulartics2Mixpanel } from 'angulartics2/mixpanel';

import * as mixpanel from '../actions/mixpanel';

@Injectable()
export class MixpanelEffects {
  @Effect({ dispatch: false })
  mixpanelActionTracking$ = this.actions$
    .ofType(mixpanel.MIXPANEL_TRACK)
    .do((action: mixpanel.MixpanelTrack) => {
      // ATTENTION HERE
      this.angulartics2Mixpanel.eventTrack(action.payload.action, {
        ...action.payload.properties,
      });
    });

  constructor(private actions$: Actions,
              private angulartics2Mixpanel: Angulartics2Mixpanel) {
  }
}
```
### Usage:
Somewhere in our application, we might have the code to dispatch a mixpanel action:
```angular2html
  @Effect()
  someEffect$ = this.actions$
    .ofType(some.ACTION)
    .map(action => new mixpanel.MixpanelTrack({
      action: action.type,
      properties: {
        category: 'Your Category',
        labelOrWhatever: 'LabelHere',
      }
    }));
```
### Common error:
The custom properties object should be a **new object**, otherwise the action will not be recorded successfully. For example the code below will be ignored by the server.
```angular2html
@Injectable()
export class MixpanelEffects {
  ...
    .do((action: mixpanel.MixpanelTrack) => {
      // reuse the existing properties is WRONG
      this.angulartics2Mixpanel.eventTrack(action.payload.action, action.payload.properties);
    });
  ...
}
```

## Using Angulartics2MixpanelAsync

This alternate provider defers Mixpanel initialization, allowing the app to perform any async tasks (such as fetching a Mixpanel token). All events before initialization will be buffered and sent immediately after.

The setup of `Angulartics2MixpanelAsync` is slightly different. You can pass some setup options during import.

```angular2html
@NgModule({
  imports: [
    BrowserModule,
    RouterModule.forRoot(ROUTES),

    // added to imports
    Angulartics2Module.forRoot([Angulartics2MixpanelAsync.setup(options)]),
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
})
```

The `MixpanelAsyncOptions` interface (passed in the `setup` method):
  - `timeoutMs: number` - (default: 30000) The buffer time in milliseconds allowed for Mixpanel init.
  - `initToken: string` - Include your Mixpanel token to init ASAP during service setup.
  - `config: Mixpanel.Config` - Mixpanel config options (see Mixpanel's documentation).
  - `libraryName: string` - Mixpanel library name option (see Mixpanel's documentation).

The `Angulartics2MixpanelAsync` service also allows you to initialize Mixpanel via a class method at any time (like in an app_init Effect). 
```angular2html
class MyComponent {
  constructor(private mixpanel: Angulartics2MixpanelAsync) {
    this.mixpanel.init(token[, config, libraryName]);
  }
}
```
