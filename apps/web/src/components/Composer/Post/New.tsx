import { PencilSquareIcon } from '@heroicons/react/24/outline';
import getAvatar from '@hey/lib/getAvatar';
import getLennyURL from '@hey/lib/getLennyURL';
import getProfile from '@hey/lib/getProfile';
import { Card, Image } from '@hey/ui';
import { useRouter } from 'next/router';
import { type FC, useEffect } from 'react';
import { usePublicationStore } from 'src/store/non-persisted/publication/usePublicationStore';
import { useGlobalModalStateStore } from 'src/store/non-persisted/useGlobalModalStateStore';
import useProfileStore from 'src/store/persisted/useProfileStore';

const NewPost: FC = () => {
  const { isReady, push, query } = useRouter();
  const currentProfile = useProfileStore((state) => state.currentProfile);
  const setShowNewPostModal = useGlobalModalStateStore(
    (state) => state.setShowNewPostModal
  );
  const setPublicationContent = usePublicationStore(
    (state) => state.setPublicationContent
  );

  const openModal = () => {
    setShowNewPostModal(true);
  };

  useEffect(() => {
    if (isReady && query.text) {
      const { hashtags, text, url, via } = query;
      let processedHashtags;

      if (hashtags) {
        processedHashtags = (hashtags as string)
          .split(',')
          .map((tag) => `#${tag} `)
          .join('');
      }

      const content = `${text}${
        processedHashtags ? ` ${processedHashtags} ` : ''
      }${url ? `\n\n${url}` : ''}${via ? `\n\nvia @${via}` : ''}`;

      openModal();
      setPublicationContent(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center space-x-3">
        <Image
          alt={currentProfile?.id}
          className="size-11 cursor-pointer rounded-full border bg-gray-200 dark:border-gray-700"
          height={44}
          onClick={() => push(getProfile(currentProfile).link)}
          onError={({ currentTarget }) => {
            currentTarget.src = getLennyURL(currentProfile?.id);
          }}
          src={getAvatar(currentProfile)}
          width={44}
        />
        <button
          className="outline-brand-500 flex w-full items-center space-x-2 rounded-xl border bg-gray-100 px-4 py-2 dark:border-gray-700 dark:bg-gray-900"
          onClick={() => openModal()}
          type="button"
        >
          <PencilSquareIcon className="size-5" />
          <span>What's happening?</span>
        </button>
      </div>
    </Card>
  );
};

export default NewPost;
