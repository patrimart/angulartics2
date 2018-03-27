import { Injectable } from '@angular/core';

import { Angulartics2 } from 'angulartics2';
import { Subject } from 'rxjs/Subject';
import { from } from 'rxjs/observable/from';
import { merge } from 'rxjs/observable/merge';
import { buffer, first, map, mergeAll, switchMap, timeout } from 'rxjs/operators';

declare var mixpanel: Mixpanel;

export interface MixpanelAsyncOptions {
  readonly timeoutMs: number;
  readonly initToken: string;
  readonly config?: Mixpanel.Config;
  readonly libraryName?: string;
}

@Injectable()
export class Angulartics2MixpanelAsync {
  private static options: MixpanelAsyncOptions;

  private paused$ = new Subject<boolean>();

  public static setup(options: Partial<MixpanelAsyncOptions> = {}) {
    Angulartics2MixpanelAsync.options = {
      timeoutMs: 30000,
      initToken: '',
      ...options,
    };
    return Angulartics2MixpanelAsync;
  }

  constructor(private angulartics2: Angulartics2) {
    const { timeoutMs, initToken, config, libraryName } = Angulartics2MixpanelAsync.options;
    const events$ = merge(
      this.angulartics2.pageTrack.pipe(
        this.angulartics2.filterDeveloperMode(),
        map(({ path: page }) => (mp: Mixpanel) => mp.track('Page Viewed', { page })),
      ),
      this.angulartics2.eventTrack.pipe(
        this.angulartics2.filterDeveloperMode(),
        map(({ action, properties }) => (mp: Mixpanel) => mp.track(action, properties)),
      ),
      this.angulartics2.setUsername.pipe(
        map(userId => (mp: Mixpanel) => mp.identify(String(userId))),
      ),
      this.angulartics2.setUserProperties.pipe(
        map(properties => (mp: Mixpanel) => mp.people.set(properties)),
      ),
      this.angulartics2.setUserPropertiesOnce.pipe(
        map(properties => (mp: Mixpanel) => mp.people.set_once(properties)),
      ),
      this.angulartics2.setSuperProperties.pipe(
        map(properties => (mp: Mixpanel) => mp.register(properties)),
      ),
      this.angulartics2.setSuperPropertiesOnce.pipe(
        map(properties => (mp: Mixpanel) => mp.register_once(properties)),
      ),
      this.angulartics2.setAlias.pipe(map(alias => (mp: Mixpanel) => mp.alias(alias))),
    );

    events$.pipe(
      timeout(timeoutMs),
      buffer(this.paused$),
      first(),
      switchMap(events => merge(from(events), events$)),
    ).subscribe(fn => fn(mixpanel));

    if (initToken) {
      this.init(initToken, config, libraryName);
    }
  }

  public init(token: string, config?: Mixpanel.Config, libraryName?: string) {
    if (mixpanel.track !== undefined) {
      mixpanel.init(token, config, libraryName);
      this.paused$.next(true);
    }
  }
}
