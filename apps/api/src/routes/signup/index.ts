import type { Handler } from 'express';
import type { Address } from 'viem';

import { HeyLensSignup } from '@hey/abis';
import { HEY_LENS_SIGNUP, ZERO_ADDRESS } from '@hey/data/constants';
import logger from '@hey/lib/logger';
import crypto from 'crypto';
import catchedError from 'src/lib/catchedError';
import { invalidBody, noBody, notAllowed } from 'src/lib/responses';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { polygon, polygonMumbai } from 'viem/chains';
import { boolean, object, string } from 'zod';

type ExtensionRequest = {
  meta: {
    custom_data: {
      address: string;
      delegatedExecutor: string;
      handle: string;
    };
    test_mode: boolean;
  };
};

const validationSchema = object({
  meta: object({
    custom_data: object({
      address: string(),
      delegatedExecutor: string(),
      handle: string()
    }),
    test_mode: boolean()
  })
});

export const post: Handler = async (req, res) => {
  const { body } = req;

  if (!body) {
    return noBody(res);
  }

  try {
    const secret = process.env.SECRET!;
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(req.body).digest('hex'), 'utf8');
    const signature = Buffer.from(req.get('X-Signature') || '', 'utf8');

    if (!crypto.timingSafeEqual(digest, signature)) {
      throw new Error('Invalid signature.');
    }
  } catch (error) {
    return catchedError(res, error);
  }

  // env is delimited by commas with no spaces
  const privateKeys = process.env.RELAYER_PRIVATE_KEYS;

  if (!privateKeys) {
    return notAllowed(res);
  }

  const parsedBody = JSON.parse(body);
  const validation = validationSchema.safeParse(parsedBody);

  if (!validation.success) {
    return invalidBody(res);
  }

  const { meta } = parsedBody as ExtensionRequest;
  const { custom_data, test_mode } = meta;
  const { address, delegatedExecutor, handle } = custom_data;

  const allPrivateKeys = privateKeys.split(',');
  const randomPrivateKey =
    allPrivateKeys[Math.floor(Math.random() * allPrivateKeys.length)];

  try {
    const account = privateKeyToAccount(randomPrivateKey as Address);

    const client = createWalletClient({
      account,
      chain: test_mode ? polygonMumbai : polygon,
      transport: http()
    });

    const hash = await client.writeContract({
      abi: HeyLensSignup,
      address: HEY_LENS_SIGNUP,
      args: [[address, ZERO_ADDRESS, '0x'], handle, [delegatedExecutor]],
      functionName: 'createProfileWithHandle'
    });

    logger.info(
      `Minted Lens Profile for ${address} with handle ${handle} on ${hash}`
    );

    return res.status(200).json({ hash, success: true });
  } catch (error) {
    return catchedError(res, error);
  }
};
