import { AppStoreConnectAPI } from 'appstore-connect-sdk'
import {
  Profile,
  ProfilesApi,
  ProfileAttributesProfileStateEnum,
  ProfilesBundleIdGetToOneRelatedFieldsBundleIdsEnum
} from 'appstore-connect-sdk/openapi'

export async function fetch_provisioning_profile(
  issuerId: string,
  privateKeyId: string,
  privateKey: string,
  profileType: string,
  bundleId: string
): Promise<Profile> {
  try {
    const client = new AppStoreConnectAPI({
      issuerId: issuerId,
      privateKeyId: privateKeyId,
      privateKey: privateKey
    })

    const api = await client.create(ProfilesApi)

    // 获取所有 Provisioning Profiles
    const res = await api.profilesGetCollection()
    const profiles = res.data.filter((v) => {
      const isActive =
        v.attributes?.profileState === ProfileAttributesProfileStateEnum.Active
      return isActive && v.attributes?.profileType === profileType
    })

    if (profiles.length === 0) {
      throw new Error(
        `No active provisioning profiles found for type: ${profileType}`
      )
    }

    for (const p of profiles) {
      try {
        const params = {
          id: p.id,
          fieldsBundleIds: [
            ProfilesBundleIdGetToOneRelatedFieldsBundleIdsEnum.Identifier
          ]
        }
        const res_profile = await api.profilesBundleIdGetToOneRelated(params)
        if (res_profile.data.attributes?.identifier === bundleId) {
          return p
        }
      } catch (error) {
        console.error(
          `Error fetching bundle ID for profile ${p.id}:`,
          error instanceof Error ? error.message : error
        )
      }
    }

    throw new Error(
      `No matching provisioning profile found for bundle ID: ${bundleId}`
    )
  } catch (error) {
    console.error(
      'fetch_provisioning_profile error:',
      error instanceof Error ? error.message : error
    )
    throw error // 抛出错误给调用方处理
  }
}
