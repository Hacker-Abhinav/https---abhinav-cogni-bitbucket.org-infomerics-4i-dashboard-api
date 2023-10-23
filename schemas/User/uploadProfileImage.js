const uploadProfileImage = {
    body: {
      type: 'object',
      isFileType: true,
      properties: {
        profile_image: {
          type: 'string'
        },
        uuid: {
            type: 'string',
        },
      },
      required: ["uuid"]
    },
  };
    
  module.exports = {
    uploadProfileImage,
  };