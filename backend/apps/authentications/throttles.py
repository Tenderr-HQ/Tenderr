from rest_framework.throttling import AnonRateThrottle


class RegisterThrottle(AnonRateThrottle):
    scope = 'register'
    rate = '10/hour'


class LoginThrottle(AnonRateThrottle):
    scope = 'login'
    rate = '20/hour'


class PasswordResetThrottle(AnonRateThrottle):
    scope = 'password_reset'
    rate = '5/hour'


class OAuthThrottle(AnonRateThrottle):
    scope = 'oauth'
    rate = '60/hour'