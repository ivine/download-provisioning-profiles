import * as core from '@actions/core'
import { Profile } from 'appstore-connect-sdk/openapi'
import fs from 'fs'
import path from 'path'
import os from 'os'

import { fetch_provisioning_profile } from './asc_api.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  const issuer_id = core.getInput('issuer-id')
  const private_key_id = core.getInput('private-key-id')
  const private_key = core.getInput('private-key')
  const profile_type = core.getInput('profile-type')
  const bundle_id: string = core.getInput('bundle-id')
  const save_to_current_dir = core.getInput('save-to-current-dir')
  const save_to_provisioning_profiles_dir = core.getInput(
    'save-to-provisioning-profiles-dir'
  )

  try {
    const profile: Profile | undefined = await fetch_provisioning_profile(
      issuer_id,
      private_key_id,
      private_key,
      profile_type,
      bundle_id
    )
    if (!profile) {
      core.setFailed('❌ No provisioning profile found.')
      return
    }

    // 📌 获取 Profile 数据 & 生成文件名
    const profileName = (profile.attributes?.name ?? '').replace(/\s+/g, '_') // 替换空格
    const profileData = Buffer.from(
      profile.attributes?.profileContent ?? '',
      'base64'
    )
    const fileName = `${profileName}.mobileprovision`

    // ✅ 保存到当前目录
    if (save_to_current_dir) {
      const currentDirPath = path.join(process.cwd(), fileName)
      fs.writeFileSync(currentDirPath, profileData)
      core.info(`✅ Saved to: ${currentDirPath}`)
    }

    // ✅ 保存到 ~/Library/MobileDevice/Provisioning Profiles/
    if (save_to_provisioning_profiles_dir) {
      const provisioningProfilesDir = path.join(
        os.homedir(),
        'Library/MobileDevice/Provisioning Profiles'
      )
      if (!fs.existsSync(provisioningProfilesDir)) {
        fs.mkdirSync(provisioningProfilesDir, { recursive: true })
      }
      const provisioningProfilePath = path.join(
        provisioningProfilesDir,
        fileName
      )
      fs.writeFileSync(provisioningProfilePath, profileData)
      core.info(`✅ Saved to: ${provisioningProfilePath}`)
    }
    core.info('🎉 Provisioning profile download complete.')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
