<Header />
      <main>{children}</main>
      {!loc.pathname.startsWith(\"/admin\") && <Footer />}
      {!loc.pathname.startsWith(\"/admin\") && <PopUnder />}
