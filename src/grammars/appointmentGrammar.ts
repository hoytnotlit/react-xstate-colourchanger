export const grammar = `
<grammar root="initial">
    <!--e.g. “create meeting with Bob on Friday at noon”, 
        “create meeting with Bob on Friday”, “create meeting with Bob”.-->
    <rule id="initial">
        <item repeat="0-1">please</item>
        <ruleref uri="#meeting" />
        <tag>out.meeting = rules.meeting;</tag>
    </rule>

    <rule id="meeting">
        <!--TODO create meeting on Friday at noon-->
        <!--everything is optional so the grammar can be reused -->
        <item repeat="0-1">create

            <item repeat="0-1">
                <one-of>
                    <item>a</item>
                    <item>an</item>
                </one-of>
            </item>
            <one-of>
                <item>meeting</item>
                <item>appointment</item>
            </one-of>
        </item>
        <item repeat="0-1">with</item>
        <ruleref uri="#person" />
        <ruleref uri="#day" />
        <ruleref uri="#time" />
        <tag>out.person=rules.person;out.day=rules.day;out.time=rules.time;</tag>
    </rule>

    <rule id="person">
        <item repeat="0-1">
            <one-of>
                <item>Bob</item>
                <item>Anna</item>
                <item>John</item>
                <item>Patricia</item>
                <item>Mary</item>
                <item>Mike</item>
                <item>Bill</item>
            </one-of>
        </item>
    </rule>

    <rule id="day">
        <item repeat="0-1">
            <item repeat="0-1">on</item>
            <one-of>
                <item>Monday <tag> out = "monday"; </tag>
                </item>
                <item>Tuesday<tag> out = "tuesday"; </tag>
                </item>
                <item>Wednesday<tag> out = "wednesday"; </tag>
                </item>
                <item>Thursday<tag> out = "thursday"; </tag>
                </item>
                <item>Friday<tag> out = "friday"; </tag>
                </item>
                <item>Saturday<tag> out = "saturday"; </tag>
                </item>
                <item>Sunday<tag> out = "sunday"; </tag>
                </item>
                <item>tomorrow<tag> out = "tomorrow"; </tag>
                </item>
            </one-of>
        </item>
    </rule>

    <rule id="time">
        <item repeat="0-1">
            at
            <one-of>
                <item>noon <tag> out = 12; </tag>
                </item>
                <item>afternoon <tag> out = "afternoon"; </tag>
                </item>
            </one-of>
        </item>
    </rule>

</grammar>
`