const awsmobile = {
  Auth: {
    region: "ap-south-1",
    userPoolId: "ap-south-1_GfxsWq4hp",
    userPoolWebClientId: "7d6vpnki5ml570b9i0jv690ulu",
    oauth: {
      domain: "chatui-demo.auth.ap-south-1.amazoncognito.com",
      scope: ["email", "openid", "profile"],
      redirectSignIn:
        "https://vitejsviteeobaawxx-pvfs--5173--cf284e50.local-corp.webcontainer.io/",
      redirectSignOut:
        "https://vitejsviteeobaawxx-pvfs--5173--cf284e50.local-corp.webcontainer.io/",
      responseType: "code",
    },
  },
};

export default awsmobile;
