import slugify from 'slugify';

export default ({ env }) => ({
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
      },
      actionOptions: {
        upload: {
          public_id: (file) => {
            const name = file.name.split('.').slice(0, -1).join('.');
            const ext = file.ext;
            return slugify(name, { lower: true, strict: true }) + ext;
          },
        },
        delete: {},
      },
    },
  },
});
