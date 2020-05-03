function mySettings(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">Fitbit Account</Text>}>
        <Oauth
          settingsKey="oauth"
          title="Login"
          label="Fitbit"
          status="Login"
          authorizeUrl="https://www.fitbit.com/oauth2/authorize"
          requestTokenUrl="https://api.fitbit.com/oauth2/token"
          clientId="22BG7J"
          clientSecret="a1fdb148d2dc791d8159b2005b4899b9"
          scope="sleep heartrate activity social nutrition settings profile location weight"
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);