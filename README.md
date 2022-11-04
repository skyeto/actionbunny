# ActionBunny

GitHub action to upload files to BunnyCDN Storage. Checks if files are already present by comparing checksums to avoid uploading files twice.

## Setting up

1. Create a storage bucket in the BunnyCDN panel, copy the password.
2. Add the following job to your workflow:
```yaml
- name: Upload
uses: skyeto/actionbunny@main
with:
  source: "dist"
  storageZone: "${{ secrets.STORAGEZONE }}"
  storageKey: "${{ secrets.STORAGEKEY }}"
  apiKey: "${{ secrets.APIKEY }}"
```
3. Set `source` to the folder you want to upload, `storageZone` to the name of your bucket, `storageKey` to the password from step 1, and `apiKey` to your BunnyCDN API key.

You can find an example [here](https://github.com/skyeto/blog/blob/main/.github/workflows/main.yml).
