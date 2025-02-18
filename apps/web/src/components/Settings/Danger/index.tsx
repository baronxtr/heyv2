import type { NextPage } from 'next';

import MetaTags from '@components/Common/MetaTags';
import NotLoggedIn from '@components/Shared/NotLoggedIn';
import WrongWallet from '@components/Shared/Settings/WrongWallet';
import { APP_NAME } from '@hey/data/constants';
import { PAGEVIEW } from '@hey/data/tracking';
import { GridItemEight, GridItemFour, GridLayout } from '@hey/ui';
import { Leafwatch } from '@lib/leafwatch';
import { useEffect } from 'react';
import useProfileStore from 'src/store/persisted/useProfileStore';
import { useAccount } from 'wagmi';

import SettingsSidebar from '../Sidebar';
import DeleteSettings from './Delete';
import GuardianSettings from './Guardian';

const DangerSettings: NextPage = () => {
  const currentProfile = useProfileStore((state) => state.currentProfile);
  const { address } = useAccount();
  const disabled = currentProfile?.ownedBy.address !== address;

  useEffect(() => {
    Leafwatch.track(PAGEVIEW, { page: 'settings', subpage: 'danger' });
  }, []);

  if (!currentProfile) {
    return <NotLoggedIn />;
  }

  return (
    <GridLayout>
      <MetaTags title={`Delete Profile • ${APP_NAME}`} />
      <GridItemFour>
        <SettingsSidebar />
      </GridItemFour>
      <GridItemEight className="space-y-5">
        {disabled ? (
          <WrongWallet />
        ) : (
          <>
            <GuardianSettings />
            <DeleteSettings />
          </>
        )}
      </GridItemEight>
    </GridLayout>
  );
};

export default DangerSettings;
